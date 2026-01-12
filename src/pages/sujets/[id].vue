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
  return pb.files.getUrl(sujet.value, sujet.value.image_marque);
});

const sujetPdfUrl = computed(() => {
  if (!sujet.value?.sujet_pdf) return null;
  return pb.files.getUrl(sujet.value, sujet.value.sujet_pdf);
});

/* -------------------------------------------------------
   MODALE "Demander ce projet" + création de Groupe
------------------------------------------------------- */
const modalOpen = ref(false);
const usersLoading = ref(false);
const usersError = ref("");
const users = ref([]);

const search = ref("");
const selectedIds = ref([]); // ids de users sélectionnés
const addingSelectOpen = ref(false);
const selectedToAdd = ref(""); // id sélectionné dans le select

const submitLoading = ref(false);
const submitError = ref("");
const createdGroupId = ref(null);

const userDisplayName = (u) => {
  const prenom = (u?.prenom || "").trim();
  const nom = (u?.nom || "").trim();
  const full = `${prenom} ${nom}`.trim();
  return full || u?.name || u?.username || u?.email || "Utilisateur";
};

// Avatar (si ton users a un champ fichier "avatar")
const userAvatarUrl = (u) => {
  if (!u) return null;
  const file = u.avatar || u.photo || u.image; // fallback si tu utilises un autre champ
  if (!file) return null;
  try {
    return pb.files.getUrl(u, file);
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

// options dispo = users pas encore sélectionnés
const availableUsers = computed(() => {
  const set = new Set(selectedIds.value);
  return filteredUsers.value.filter((u) => !set.has(u.id));
});

const openModal = async () => {
  modalOpen.value = true;
  submitError.value = "";
  createdGroupId.value = null;

  // charge users si pas déjà fait
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

const loadUsers = async () => {
  usersLoading.value = true;
  usersError.value = "";
  try {
    // ⚠️ nécessite que la collection users soit lisible (List rule = true) ou que tu sois connecté
    // tu peux trier par nom/prenom si ces champs existent chez toi
    users.value = await pb.collection("users").getFullList({
      sort: "created",
    });
  } catch (e) {
    console.error(e);
    usersError.value =
      e?.data?.message ||
      e?.message ||
      "Impossible de charger la liste des utilisateurs.";
  } finally {
    usersLoading.value = false;
  }
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

const createGroup = async () => {
  submitLoading.value = true;
  submitError.value = "";
  createdGroupId.value = null;

  try {
    if (!sujet.value) throw new Error("Sujet non chargé.");
    if (selectedIds.value.length === 0) {
      throw new Error("Ajoute au moins 1 membre dans le groupe.");
    }

    // 1) Créer le groupe
    const groupPayload = {
      nom: sujet.value.titre || "Groupe",
      membres: selectedIds.value,
    };

    const createdGroup = await pb.collection("Groupe").create(groupPayload);
    createdGroupId.value = createdGroup.id;

    // 2) Créer le projet lié au groupe
    // ⚠️ On utilise un FormData pour pouvoir upload "photo"
    const fd = new FormData();

    // Champs texte
    fd.append("titre", sujet.value.titre || "Projet");
    fd.append("description", sujet.value.description || "");
    fd.append("sujet", sujet.value.id);
    fd.append("id_sujet", sujet.value.id);

    // Relation vers le groupe (⚠️ adapte si ton champ projet->groupe s'appelle autrement)
    fd.append("groupe", createdGroup.id);

    // Copier image_marque -> photo (re-upload)
    if (sujet.value.image_marque) {
      const url = pb.files.getUrl(sujet.value, sujet.value.image_marque);

      // On récupère le fichier depuis PocketBase en blob
      const res = await fetch(url);
      if (!res.ok) throw new Error("Impossible de récupérer l'image de marque.");
      const blob = await res.blob();

      // Nom de fichier (garde l’extension si possible)
      const originalName = sujet.value.image_marque;
      const ext = originalName.includes(".") ? originalName.split(".").pop() : "jpg";
      const fileName = `photo_sujet_${sujet.value.id}.${ext}`;

      // Crée un File et l’upload dans "photo"
      const file = new File([blob], fileName, { type: blob.type || "image/jpeg" });
      fd.append("photo", file);
    }

    // ⚠️ Important : si ton Projet a d'autres champs required, ajoute-les ici (statut, date_creation, etc.)
    const createdProject = await pb.collection("Projet").create(fd);

    // Optionnel : rediriger vers le projet créé
    // (si ta route existe /projets/:id)
    router.push(`/projets/${createdProject.id}`);

    // ou fermer la modale :
    // closeModal();
  } catch (e) {
    console.error(e);
    submitError.value =
      e?.data?.message ||
      e?.message ||
      "Impossible de créer le groupe + projet (droits PocketBase ?).";
  } finally {
    submitLoading.value = false;
  }
};


// petit confort : quand on ferme/réouvre, on garde la sélection
watch(modalOpen, (open) => {
  if (!open) {
    addingSelectOpen.value = false;
    selectedToAdd.value = "";
    search.value = "";
  }
});

/* ------------------------------------------------------- */

onMounted(async () => {
  try {
    if (!id.value) {
      router.replace("/sujets");
      return;
    }

    // "sujets" = nom de ta collection
    sujet.value = await pb.collection("sujets").getOne(id.value, {
      expand: "commanditaire",
    });
  } catch (e) {
    console.error(e);
    error.value =
      e?.data?.message ||
      e?.message ||
      "Impossible de charger ce sujet.";
  } finally {
    loading.value = false;
  }
});

const parcoursLabel = (p) => {
  const s = String(p || "").toLowerCase();
  if (s === "dev") return "Dev";
  if (s === "créa" || s === "crea" || s === "design") return "Design";
  if (s === "com") return "Com";
  return p || "";
};

const anneeLabelShort = (a) => {
  const s = String(a || "");
  if (s === "1") return "1ère année";
  if (s === "2") return "2ème année";
  if (s === "3") return "3ème année";
  return s ? `${s}ème année` : "";
};

const memberSubtitle = (u) => {
  const annee = anneeLabelShort(u?.annee);
  const parcours = parcoursLabel(u?.parcours || u?.specialisation);
  if (annee && parcours) return `${annee} – ${parcours}`;
  return annee || parcours || "";
};

const initials = (name) => {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const a = parts[0]?.[0] || "";
  const b = parts[1]?.[0] || "";
  return (a + b).toUpperCase();
};

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

              <span class="text-white/60 text-sm">
                Commanditaire :
                <span class="text-white font-semibold">
                  {{
                    sujet?.expand?.commanditaire?.name
                      || sujet?.expand?.commanditaire?.username
                      || sujet?.expand?.commanditaire?.email
                      || "Non renseigné"
                  }}
                </span>
              </span>
            </div>
          </div>

          <button
            type="button"
            class="text-[#CFFFBC] hover:underline"
            @click="router.push('/sujets')"
          >
            ← Retour
          </button>
        </div>

        <!-- Contenu (2 colonnes) -->
        <div class="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Colonne gauche : contenu -->
          <div class="lg:col-span-2 space-y-8">
            <!-- Description -->
            <section class="rounded-2xl border border-white/10 bg-black/20 p-6">
              <h2 class="text-xl font-extrabold mb-3">Description</h2>
              <p class="text-white/80 leading-relaxed whitespace-pre-line">
                {{ sujet?.description || "—" }}
              </p>
            </section>

            <!-- Objectifs -->
            <section class="rounded-2xl border border-white/10 bg-black/20 p-6">
              <h2 class="text-xl font-extrabold mb-3">Objectifs</h2>
              <p class="text-white/80 leading-relaxed whitespace-pre-line">
                {{ sujet?.objectifs || "—" }}
              </p>
            </section>

            <!-- Compétences -->
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

          <!-- Colonne droite : fichiers / contact -->
          <aside class="space-y-6">
            <!-- Image marque -->
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

            <!-- PDF -->
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

            <!-- Contact -->
            <section class="rounded-2xl border border-white/10 bg-black/20 p-5">
              <h3 class="font-extrabold mb-2">Contact</h3>
              <p class="text-white/80 text-sm">
                Email :
                <span class="text-white font-semibold">
                  {{ sujet?.mail || "—" }}
                </span>
              </p>
            </section>

            <!-- Bouton demander le projet (desktop) -->
            <button
              type="button"
              class="hidden lg:inline-flex items-center justify-center w-full bg-[#CFFFBC] text-black font-semibold py-3 rounded-full hover:bg-[#B8E6A8] transition"
              @click="openModal"
            >
              Demander ce projet
            </button>
          </aside>
        </div>

        <!-- Bouton demander le projet (mobile / sticky en bas comme maquette) -->
        <div class="lg:hidden fixed left-0 right-0 bottom-0 p-4 bg-black/40 backdrop-blur border-t border-white/10">
          <button
            type="button"
            class="w-full bg-[#CFFFBC] text-black font-semibold py-3 rounded-full hover:bg-[#B8E6A8] transition"
            @click="openModal"
          >
            Demander ce projet
          </button>
        </div>
      </template>
    </div>

    <!-- MODALE -->
    <div
      v-if="modalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center px-4"
      aria-modal="true"
      role="dialog"
    >
      <!-- overlay -->
      <div class="absolute inset-0 bg-black/70" @click="closeModal" />

      <!-- panel -->
      <div class="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#1C2230] shadow-2xl overflow-hidden">
        <div class="p-6 md:p-7">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-3xl font-extrabold text-[#CFFFBC]">
                Demander ce projet
              </h2>
              <p class="text-white/70 mt-1 text-sm">
                Crée un groupe sur PocketBase avec le nom du sujet.
              </p>
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

          <!-- erreurs / loading users -->
          <p v-if="usersLoading" class="mt-3 text-white/70">Chargement des utilisateurs...</p>
          <p v-else-if="usersError" class="mt-3 text-red-300">{{ usersError }}</p>

          <!-- membres sélectionnés -->
          <div v-else class="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              v-for="u in selectedUsers"
              :key="u.id"
              class="rounded-xl bg-white/5 border border-white/10 p-4 flex flex-col items-center text-center"
            >
              <div class="w-16 h-16 rounded-full overflow-hidden border border-white/10 bg-white/5">
                <img
                  v-if="userAvatarUrl(u)"
                  :src="userAvatarUrl(u)"
                  alt=""
                  class="w-full h-full object-cover"
                />
              </div>

              <p class="mt-3 font-semibold text-[#CFFFBC]">
                {{ userDisplayName(u) }}
              </p>

              <button
                type="button"
                class="mt-3 text-xs text-white/60 hover:text-red-300"
                @click="removeMember(u.id)"
              >
                Retirer
              </button>
            </div>

            <!-- placeholder si aucun membre -->
            <div
              v-if="selectedUsers.length === 0"
              class="sm:col-span-3 rounded-xl border border-white/10 bg-white/5 p-4 text-white/70"
            >
              Aucun membre ajouté pour le moment.
            </div>
          </div>

          <!-- Ajouter un membre -->
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
                  <option
                    v-for="u in availableUsers"
                    :key="u.id"
                    :value="u.id"
                  >
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

          <!-- Erreur submit -->
          <p v-if="submitError" class="mt-4 text-red-300 font-medium">
            {{ submitError }}
          </p>

          <!-- Succès -->
          <p v-if="createdGroupId" class="mt-4 text-green-200 font-semibold">
            Groupe créé ✅ (id: {{ createdGroupId }})
          </p>

          <!-- CTA -->
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
            Si ça échoue, vérifie les **API Rules** de la collection <b>Groupe</b> (Create rule) et <b>users</b> (List rule).
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
