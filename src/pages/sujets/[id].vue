<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import AppHeader from "@/components/AppHeader.vue";
import { pb } from "../../pb";

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const error = ref("");
const sujet = ref(null);

const id = computed(() => String(route.params.id || ""));

// -------------------------
// AUTH / ROLES
// -------------------------
const authUser = computed(() => pb.authStore?.model || pb.authStore?.record || null);

const userType = computed(() =>
  String(authUser.value?.type_utilisateur || authUser.value?.role || authUser.value?.type || "").toLowerCase()
);

const isTeacher = computed(() => ["prof", "enseignant", "admin"].includes(userType.value));

// ✅ on cache "Demander ce projet" pour prof/enseignant/admin
const canRequestProject = computed(() => !isTeacher.value);

// ✅ vérification sujet => le projet n'est demandable que si verification = true
const isVerified = computed(() => Boolean(sujet.value?.verification));
const canActuallyRequest = computed(() => canRequestProject.value && isVerified.value);

// ✅ le prof peut modifier (option recommandée : seulement s’il est le commanditaire, ou admin)
const isOwner = computed(() => {
  const uid = authUser.value?.id;
  const cmd = sujet.value?.commanditaire || sujet.value?.expand?.commanditaire?.id;
  return uid && cmd && String(uid) === String(cmd);
});

const commanditaireAvatarUrl = (u) => {
  if (!u) return null;
  const file = u.avatar || u.photo || u.image;
  if (!file) return null;
  try {
    return pb.files.getURL(u, file);
  } catch {
    return null;
  }
};

const commanditaireInitial = (u) => {
  const name =
    u?.name || u?.username || u?.email || "";
  return name ? name.charAt(0).toUpperCase() : "?";
};


const canEditSujet = computed(() => {
  if (!authUser.value?.id) return false;
  if (userType.value === "admin") return true;
  return isTeacher.value && isOwner.value;
});

// -------------------------
// LABELS / HELPERS
// -------------------------
const anneeLabel = (a) => {
  const s = String(a || "");
  if (s === "1") return "1ère année";
  if (s === "2") return "2ème année";
  if (s === "3") return "3ème année";
  return s ? `${s}ème année` : "";
};

const typeLabel = (t) => {
  const s = String(t || "").toLowerCase();
  if (s === "collectif") return "Collectif";
  if (s === "solo") return "Individuel";
  return t || "";
};

// URLs fichiers
const imageMarqueUrl = computed(() => {
  if (!sujet.value?.image_marque) return null;
  return pb.files.getURL(sujet.value, sujet.value.image_marque);
});

const sujetPdfUrl = computed(() => {
  if (!sujet.value?.sujet_pdf) return null;
  return pb.files.getURL(sujet.value, sujet.value.sujet_pdf);
});

// -------------------------
// MODALE "Demander ce projet" (inchangée pour les étudiants)
// -------------------------
const modalOpen = ref(false);
const usersLoading = ref(false);
const usersError = ref("");
const users = ref([]);

const search = ref("");
const selectedIds = ref([]);
const addingSelectOpen = ref(false);
const selectedToAdd = ref("");

const submitLoading = ref(false);
const submitError = ref("");
const createdGroupId = ref(null);

const userDisplayName = (u) => {
  const prenom = (u?.prenom || "").trim();
  const nom = (u?.nom || "").trim();
  const full = `${prenom} ${nom}`.trim();
  return full || u?.name || u?.username || u?.email || "Utilisateur";
};

const userAvatarUrl = (u) => {
  if (!u) return null;
  const file = u.avatar || u.photo || u.image;
  if (!file) return null;
  try {
    return pb.files.getURL(u, file);
  } catch {
    return null;
  }
};

const selectedUsers = computed(() =>
  users.value.filter((u) => selectedIds.value.includes(u.id))
);

const filteredUsers = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return users.value;
  return users.value.filter((u) => {
    const name = userDisplayName(u).toLowerCase();
    const email = String(u.email || "").toLowerCase();
    return name.includes(q) || email.includes(q);
  });
});

const availableUsers = computed(() => {
  const set = new Set(selectedIds.value);
  return filteredUsers.value.filter((u) => !set.has(u.id));
});

const loadUsers = async () => {
  usersLoading.value = true;
  usersError.value = "";
  try {
    users.value = await pb.collection("users").getFullList({ sort: "created" });
  } catch (e) {
    console.error(e);
    usersError.value =
      e?.data?.message || e?.message || "Impossible de charger la liste des utilisateurs.";
  } finally {
    usersLoading.value = false;
  }
};

const openModal = async () => {
  // ✅ si pas vérifié => pas de modale
  if (!canActuallyRequest.value) return;

  modalOpen.value = true;
  submitError.value = "";
  createdGroupId.value = null;

  if (users.value.length === 0) {
    await loadUsers();
  }
};

const closeModal = () => {
  modalOpen.value = false;
  addingSelectOpen.value = false;
  selectedToAdd.value = "";
  search.value = "";
  usersError.value = "";
  submitError.value = "";
};

const addSelectedMember = () => {
  if (!selectedToAdd.value) return;
  if (!selectedIds.value.includes(selectedToAdd.value)) {
    selectedIds.value = [...selectedIds.value, selectedToAdd.value];
  }
  selectedToAdd.value = "";
  addingSelectOpen.value = false;
};

const removeMember = (userId) => {
  selectedIds.value = selectedIds.value.filter((id) => id !== userId);
};

// ✅✅✅ ICI : on ajoute l'UPDATE du Groupe pour remplir "projet"
const createGroup = async () => {
  submitLoading.value = true;
  submitError.value = "";
  createdGroupId.value = null;

  try {
    if (!canActuallyRequest.value) throw new Error("Sujet non vérifié (demande impossible).");
    if (!sujet.value) throw new Error("Sujet non chargé.");
    if (selectedIds.value.length === 0) throw new Error("Ajoute au moins 1 membre dans le groupe.");

    // 1) Création groupe
    const groupPayload = {
      nom: sujet.value.titre || "Groupe",
      membres: selectedIds.value,
    };

    const createdGroup = await pb.collection("Groupe").create(groupPayload);
    createdGroupId.value = createdGroup.id;

    // 2) Création projet
    const fd = new FormData();
    fd.append("titre", sujet.value.titre || "Projet");
    fd.append("description", sujet.value.description || "");
    fd.append("sujet", sujet.value.id);
    fd.append("id_sujet", sujet.value.id);
    fd.append("groupe", createdGroup.id);

    if (sujet.value.image_marque) {
      const url = pb.files.getURL(sujet.value, sujet.value.image_marque);
      const res = await fetch(url);
      if (!res.ok) throw new Error("Impossible de récupérer l'image de marque.");
      const blob = await res.blob();

      const originalName = sujet.value.image_marque;
      const ext = originalName.includes(".") ? originalName.split(".").pop() : "jpg";
      const fileName = `photo_sujet_${sujet.value.id}.${ext}`;
      const file = new File([blob], fileName, { type: blob.type || "image/jpeg" });
      fd.append("photo", file);
    }

    const createdProject = await pb.collection("Projet").create(fd);

    // 3) ✅ Mise à jour du groupe : relation "projet" => id du projet créé
    await pb.collection("Groupe").update(createdGroup.id, {
      projet: createdProject.id, // champ relationnel "projet" dans Groupe
    });

    // Redirect
    router.push(`/projets/${createdProject.id}`);
  } catch (e) {
    console.error(e);
    submitError.value =
      e?.data?.message || e?.message || "Impossible de créer le groupe + projet (droits PocketBase ?).";
  } finally {
    submitLoading.value = false;
  }
};

watch(modalOpen, (open) => {
  if (!open) {
    addingSelectOpen.value = false;
    selectedToAdd.value = "";
    search.value = "";
  }
});

// -------------------------
// MODALE EDIT PROF (✅ FIX: scroll + bouton visible)
// -------------------------
const editOpen = ref(false);
const editSaving = ref(false);
const editError = ref("");

const editForm = ref({
  titre: "",
  annee: "",
  type_sujet: "",
  description: "",
  objectifs: "",
  mail: "",
  competences: [],
  image_marque: null,
  sujet_pdf: null,

  // ✅ nouveau champ
  verification: false,
});

const competencesOptions = ["SEO", "Design", "Développement", "W"];

const toggleCompetence = (c) => {
  const arr = editForm.value.competences || [];
  if (arr.includes(c)) editForm.value.competences = arr.filter((x) => x !== c);
  else editForm.value.competences = [...arr, c];
};

const onEditPickImage = (e) => {
  editForm.value.image_marque = e?.target?.files?.[0] || null;
};

const onEditPickPdf = (e) => {
  editForm.value.sujet_pdf = e?.target?.files?.[0] || null;
};

const openEdit = () => {
  if (!sujet.value) return;
  editError.value = "";

  editForm.value = {
    titre: sujet.value.titre || "",
    annee: String(sujet.value.annee || ""),
    type_sujet: String(sujet.value.type_sujet || ""),
    description: sujet.value.description || "",
    objectifs: sujet.value.objectifs || "",
    mail: sujet.value.mail || "",
    competences: Array.isArray(sujet.value.competences) ? [...sujet.value.competences] : [],
    image_marque: null,
    sujet_pdf: null,

    // ✅ nouveau champ
    verification: Boolean(sujet.value.verification),
  };

  editOpen.value = true;
};

const closeEdit = () => {
  editOpen.value = false;
  editError.value = "";
};

const saveEdit = async () => {
  if (!sujet.value?.id) return;
  editSaving.value = true;
  editError.value = "";

  try {
    const fd = new FormData();
    fd.append("titre", editForm.value.titre.trim());
    fd.append("annee", String(editForm.value.annee));
    fd.append("type_sujet", editForm.value.type_sujet);
    fd.append("description", editForm.value.description.trim());
    fd.append("objectifs", editForm.value.objectifs.trim());
    fd.append("mail", editForm.value.mail.trim());

    // ✅ nouveau champ
    fd.append("verification", String(Boolean(editForm.value.verification)));

    (editForm.value.competences || []).forEach((c) => fd.append("competences", c));

    if (editForm.value.image_marque instanceof File) fd.append("image_marque", editForm.value.image_marque);
    if (editForm.value.sujet_pdf instanceof File) fd.append("sujet_pdf", editForm.value.sujet_pdf);

    await pb.collection("sujets").update(sujet.value.id, fd);
    sujet.value = await pb.collection("sujets").getOne(sujet.value.id, { expand: "commanditaire" });

    closeEdit();
  } catch (e) {
    console.error(e);
    editError.value = e?.data?.message || e?.message || "Erreur lors de la mise à jour du sujet.";
  } finally {
    editSaving.value = false;
  }
};

// -------------------------
// LOAD SUJET
// -------------------------
onMounted(async () => {
  try {
    if (!id.value) {
      router.replace("/sujets");
      return;
    }

    sujet.value = await pb.collection("sujets").getOne(id.value, {
      expand: "commanditaire",
    });
  } catch (e) {
    console.error(e);
    error.value = e?.data?.message || e?.message || "Impossible de charger ce sujet.";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="min-h-screen bg-[#151A24] text-white">
    <AppHeader />

    <div class="max-w-6xl mx-auto px-6 py-10">
      <p v-if="loading" class="text-white/70">Chargement...</p>
      <p v-else-if="error" class="text-red-300 font-medium">{{ error }}</p>

      <template v-else>
        <!-- Haut de page -->
        <div class="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <h1 class="text-4xl md:text-5xl font-extrabold leading-tight">
              {{ sujet?.titre || "(Sans titre)" }}
            </h1>

            <div class="mt-4 flex flex-wrap items-center gap-3">
              <span
                v-if="sujet?.annee"
                class="px-4 py-2 rounded-full bg-[#CFFFBC] text-black font-semibold text-sm"
              >
                {{ anneeLabel(sujet.annee) }}
              </span>

              <span
                v-if="sujet?.type_sujet"
                class="px-4 py-2 rounded-full bg-[#CFFFBC] text-black font-semibold text-sm"
              >
                {{ typeLabel(sujet.type_sujet) }}
              </span>

              <!-- ✅ Badge verification -->
              <span
                v-if="isVerified"
                class="px-4 py-2 rounded-full bg-emerald-400/20 border border-emerald-300/20 text-emerald-200 font-semibold text-sm"
              >
                ✅ Vérifié
              </span>
              <span
                v-else
                class="px-4 py-2 rounded-full bg-yellow-400/15 border border-yellow-300/20 text-yellow-200 font-semibold text-sm"
              >
                ⏳ En attente de vérification
              </span>

              <div class="flex items-center gap-2 text-sm text-white/60">
  <span>Commanditaire :</span>

  <div class="flex items-center gap-2">
    <!-- Avatar -->
    <div
      class="w-6 h-6 rounded-full overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center text-xs font-bold text-white"
    >
      <img
        v-if="commanditaireAvatarUrl(sujet?.expand?.commanditaire)"
        :src="commanditaireAvatarUrl(sujet?.expand?.commanditaire)"
        alt="Avatar commanditaire"
        class="w-full h-full object-cover"
      />
      <span v-else>
        {{ commanditaireInitial(sujet?.expand?.commanditaire) }}
      </span>
    </div>

    <!-- Nom -->
    <span class="text-white font-semibold">
      {{
        sujet?.expand?.commanditaire?.name
          || sujet?.expand?.commanditaire?.username
          || sujet?.expand?.commanditaire?.email
          || "Non renseigné"
      }}
    </span>
  </div>
</div>

            </div>
          </div>

          <div class="flex items-center gap-3">
            <!-- ✅ Bouton modifier (prof/admin) -->
            <button
              v-if="canEditSujet"
              type="button"
              class="inline-flex items-center justify-center px-5 py-3 rounded-full bg-white/10 border border-white/15 hover:bg-white/15 transition font-semibold"
              @click="openEdit"
            >
              ✎ Modifier le sujet
            </button>

            <button
              type="button"
              class="text-[#CFFFBC] hover:underline"
              @click="router.push('/sujets')"
            >
              ← Retour
            </button>
          </div>
        </div>

        <!-- Contenu (2 colonnes) -->
        <div class="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Colonne gauche -->
          <div class="lg:col-span-2 space-y-8">
            <section class="rounded-2xl border border-white/10 bg-black/20 p-6">
              <h2 class="text-xl font-extrabold mb-3">Description</h2>
              <p class="text-white/80 leading-relaxed whitespace-pre-line">
                {{ sujet?.description || "—" }}
              </p>
            </section>

            <section class="rounded-2xl border border-white/10 bg-black/20 p-6">
              <h2 class="text-xl font-extrabold mb-3">Objectifs</h2>
              <p class="text-white/80 leading-relaxed whitespace-pre-line">
                {{ sujet?.objectifs || "—" }}
              </p>
            </section>

            <section class="rounded-2xl border border-white/10 bg-black/20 p-6">
              <h2 class="text-xl font-extrabold mb-4">Compétences</h2>

              <div v-if="(sujet?.competences || []).length" class="flex flex-wrap gap-3">
                <span
                  v-for="c in sujet.competences"
                  :key="c"
                  class="px-4 py-2 rounded-full border border-white/15 bg-white/5 text-white/90 text-sm"
                >
                  {{ c }}
                </span>
              </div>

              <p v-else class="text-white/60">Aucune compétence renseignée.</p>
            </section>
          </div>

          <!-- Colonne droite -->
          <aside class="space-y-6">
            <section class="rounded-2xl border border-white/10 bg-black/20 p-5">
              <h3 class="font-extrabold mb-3">Image de marque</h3>

              <img
                v-if="imageMarqueUrl"
                :src="imageMarqueUrl"
                alt="Image de marque"
                class="w-full h-48 object-cover rounded-xl border border-white/10"
              />
              <div v-else class="w-full h-48 rounded-xl bg-white/5 border border-white/10" />
            </section>

            <section class="rounded-2xl border border-white/10 bg-black/20 p-5">
              <h3 class="font-extrabold mb-3">Sujet (PDF)</h3>

              <a
                v-if="sujetPdfUrl"
                :href="sujetPdfUrl"
                target="_blank"
                rel="noreferrer"
                class="inline-flex items-center justify-center w-full bg-[#CFFFBC] text-black font-semibold py-3 rounded-full hover:bg-[#B8E6A8] transition"
              >
                Télécharger le PDF
              </a>

              <p v-else class="text-white/60">Aucun PDF fourni.</p>
            </section>

            <section class="rounded-2xl border border-white/10 bg-black/20 p-5">
              <h3 class="font-extrabold mb-2">Contact</h3>
              <p class="text-white/80 text-sm">
                Email :
                <span class="text-white font-semibold">
                  {{ sujet?.mail || "—" }}
                </span>
              </p>
            </section>

            <!-- ✅ Bouton demander le projet (desktop) seulement si étudiant -->
            <button
              v-if="canRequestProject"
              type="button"
              class="hidden lg:inline-flex items-center justify-center w-full font-semibold py-3 rounded-full transition"
              :class="canActuallyRequest
                ? 'bg-[#CFFFBC] text-black hover:bg-[#B8E6A8]'
                : 'bg-white/10 text-white/50 border border-white/15 cursor-not-allowed'"
              :disabled="!canActuallyRequest || submitLoading"
              @click="openModal"
            >
              <span v-if="canActuallyRequest">Demander ce projet</span>
              <span v-else>En attente de vérification</span>
            </button>
          </aside>
        </div>

        <!-- ✅ Bouton demander le projet (mobile / sticky) seulement si étudiant -->
        <div
          v-if="canRequestProject"
          class="lg:hidden fixed left-0 right-0 bottom-0 p-4 bg-black/40 backdrop-blur border-t border-white/10"
        >
          <button
            type="button"
            class="w-full font-semibold py-3 rounded-full transition"
            :class="canActuallyRequest
              ? 'bg-[#CFFFBC] text-black hover:bg-[#B8E6A8]'
              : 'bg-white/10 text-white/50 border border-white/15 cursor-not-allowed'"
            :disabled="!canActuallyRequest || submitLoading"
            @click="openModal"
          >
            <span v-if="canActuallyRequest">Demander ce projet</span>
            <span v-else>En attente de vérification</span>
          </button>
        </div>
      </template>
    </div>

    <!-- ==========================
         MODALE EDIT (PROF/ADMIN)
         ✅ FIX: scroll + bouton visible
    =========================== -->
    <div
      v-if="editOpen"
      class="fixed inset-0 z-50 flex items-center justify-center px-4"
      aria-modal="true"
      role="dialog"
    >
      <div class="absolute inset-0 bg-black/70" @click="closeEdit" />

      <!-- ✅ max height + layout colonne -->
      <div
        class="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#1C2230] shadow-2xl
               max-h-[90vh] flex flex-col"
      >
        <!-- ✅ Header fixe -->
        <div class="p-6 md:p-7 border-b border-white/10">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-3xl font-extrabold text-[#CFFFBC]">Modifier le sujet</h2>
              <p class="text-white/70 mt-1 text-sm">Mettez à jour les informations du sujet.</p>
            </div>

            <button
              type="button"
              class="text-white/70 hover:text-white text-2xl leading-none"
              @click="closeEdit"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- ✅ Body scrollable -->
        <div class="flex-1 overflow-y-auto p-6 md:p-7">
          <form class="space-y-4" @submit.prevent="saveEdit">
            <div>
              <label class="block text-sm text-white/70 mb-2">Titre</label>
              <input
                v-model="editForm.titre"
                class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-white/30"
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-white/70 mb-2">Année</label>
                <select
                  v-model="editForm.annee"
                  class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-white/30"
                >
                  <option value="" disabled>Choisir</option>
                  <option value="1">1ère année</option>
                  <option value="2">2ème année</option>
                  <option value="3">3ème année</option>
                </select>
              </div>

              <div>
                <label class="block text-sm text-white/70 mb-2">Type</label>
                <select
                  v-model="editForm.type_sujet"
                  class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-white/30"
                >
                  <option value="" disabled>Choisir</option>
                  <option value="solo">Individuel</option>
                  <option value="collectif">Collectif</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-sm text-white/70 mb-2">Description</label>
              <textarea
                v-model="editForm.description"
                rows="4"
                class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label class="block text-sm text-white/70 mb-2">Objectifs</label>
              <textarea
                v-model="editForm.objectifs"
                rows="3"
                class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label class="block text-sm text-white/70 mb-2">Email</label>
              <input
                v-model="editForm.mail"
                type="email"
                class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label class="block text-sm text-white/70 mb-2">Compétences</label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="c in competencesOptions"
                  :key="c"
                  type="button"
                  @click="toggleCompetence(c)"
                  class="px-3 py-2 rounded-full border text-sm transition"
                  :class="(editForm.competences || []).includes(c)
                    ? 'bg-[#CFFFBC] text-black border-[#CFFFBC]'
                    : 'border-white/20 text-white/80 hover:border-white/40'"
                >
                  {{ c }}
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-white/70 mb-2">Image de marque (optionnel)</label>
                <input type="file" accept="image/*" @change="onEditPickImage" class="block w-full text-sm text-white/70" />
              </div>
              <div>
                <label class="block text-sm text-white/70 mb-2">PDF (optionnel)</label>
                <input type="file" accept="application/pdf" @change="onEditPickPdf" class="block w-full text-sm text-white/70" />
              </div>
            </div>

            <!-- ✅ Validation (boolean) -->
            <div class="rounded-xl bg-black/20 border border-white/10 p-4">
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="editForm.verification"
                  class="accent-[#CFFFBC] w-5 h-5"
                />
                <span class="font-semibold text-white">
                  Sujet vérifié (demandable par les étudiants)
                </span>
              </label>
              <p class="mt-2 text-sm text-white/60">
                Si décoché, les étudiants verront “En attente de vérification”.
              </p>
            </div>

            <p v-if="editError" class="text-red-300 font-medium">{{ editError }}</p>

            <!-- ✅ espace en bas pour respirer -->
            <div class="h-2"></div>
          </form>
        </div>

        <!-- ✅ Footer sticky : bouton toujours visible -->
        <div class="p-6 md:p-7 border-t border-white/10 bg-[#1C2230]">
          <button
            type="button"
            @click="saveEdit"
            class="w-full bg-[#CFFFBC] text-black font-semibold py-3 rounded-full hover:bg-[#B8E6A8] transition disabled:opacity-50"
            :disabled="editSaving"
          >
            <span v-if="editSaving">Enregistrement...</span>
            <span v-else>Enregistrer les modifications</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ==========================
         MODALE "Demander ce projet"
         (affichée seulement si étudiant + sujet vérifié)
    =========================== -->
    <div
      v-if="modalOpen && canRequestProject && isVerified"
      class="fixed inset-0 z-50 flex items-center justify-center px-4"
      aria-modal="true"
      role="dialog"
    >
      <div class="absolute inset-0 bg-black/70" @click="closeModal" />

      <div class="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#1C2230] shadow-2xl overflow-hidden">
        <div class="p-6 md:p-7">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-3xl font-extrabold text-[#CFFFBC]">Demander ce projet</h2>
              
            </div>

            <button
              type="button"
              class="text-white/70 hover:text-white text-2xl leading-none"
              @click="closeModal"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>

          <h3 class="mt-6 font-bold text-white">Membres du groupe</h3>

          <p v-if="usersLoading" class="mt-3 text-white/70">Chargement des utilisateurs...</p>
          <p v-else-if="usersError" class="mt-3 text-red-300">{{ usersError }}</p>

          <div v-else class="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              v-for="u in selectedUsers"
              :key="u.id"
              class="rounded-xl bg-white/5 border border-white/10 p-4 flex flex-col items-center text-center"
            >
              <div class="w-16 h-16 rounded-full overflow-hidden border border-white/10 bg-white/5">
                <img v-if="userAvatarUrl(u)" :src="userAvatarUrl(u)" alt="" class="w-full h-full object-cover" />
              </div>

              <p class="mt-3 font-semibold text-[#CFFFBC]">{{ userDisplayName(u) }}</p>

              <button
                type="button"
                class="mt-3 text-xs text-white/60 hover:text-red-300"
                @click="removeMember(u.id)"
              >
                Retirer
              </button>
            </div>

            <div
              v-if="selectedUsers.length === 0"
              class="sm:col-span-3 rounded-xl border border-white/10 bg-white/5 p-4 text-white/70"
            >
              Aucun membre ajouté pour le moment.
            </div>
          </div>

          <div class="mt-5">
            <div class="flex items-center gap-3">
              <button
                type="button"
                class="w-full rounded-lg border border-white/20 bg-transparent py-3 font-semibold text-white/80 hover:text-white hover:border-white/30 transition"
                @click="addingSelectOpen = !addingSelectOpen"
              >
                + Ajouter un membre
              </button>
            </div>

            <div v-if="addingSelectOpen" class="mt-3 rounded-xl border border-white/10 bg-black/20 p-4">
              <div class="flex flex-col gap-3">
                <input
                  v-model="search"
                  type="text"
                  placeholder="Rechercher un utilisateur (nom / email)…"
                  class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/30"
                />

                <select
                  v-model="selectedToAdd"
                  class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/30"
                >
                  <option value="">— Choisir un utilisateur —</option>
                  <option v-for="u in availableUsers" :key="u.id" :value="u.id">
                    {{ userDisplayName(u) }} — {{ u.email }}
                  </option>
                </select>

                <div class="flex gap-3">
                  <button
                    type="button"
                    class="flex-1 rounded-lg bg-[#CFFFBC] text-black font-semibold py-2 hover:bg-[#B8E6A8] transition disabled:opacity-50"
                    :disabled="!selectedToAdd"
                    @click="addSelectedMember"
                  >
                    Ajouter
                  </button>
                  <button
                    type="button"
                    class="flex-1 rounded-lg border border-white/20 text-white/80 font-semibold py-2 hover:text-white hover:border-white/30 transition"
                    @click="addingSelectOpen = false"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>

          <p v-if="submitError" class="mt-4 text-red-300 font-medium">{{ submitError }}</p>
          <p v-if="createdGroupId" class="mt-4 text-green-200 font-semibold">
            Groupe créé ✅ (id: {{ createdGroupId }})
          </p>

          <button
            type="button"
            class="mt-6 w-full bg-[#CFFFBC] text-black font-semibold py-3 rounded-full hover:bg-[#B8E6A8] transition disabled:opacity-50"
            :disabled="submitLoading || usersLoading"
            @click="createGroup"
          >
            <span v-if="submitLoading">Création du groupe...</span>
            <span v-else>Demander ce projet</span>
          </button>

          <p class="mt-3 text-xs text-white/50">
            N'oubliez pas de vous <b>ajouter</b> vous-même pour <b>appartenir au groupe</b> du <b>projet</b>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
