<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import AppHeader from "@/components/AppHeader.vue";
import { pb } from "../../pb";

const route = useRoute();

// data principaux
const loading = ref(true);
const error = ref("");
const projet = ref(null);
const sujet = ref(null);

const groupe = ref(null);
const membres = ref([]);
const etapes = ref([]);

// ✅ Livrables
const livrables = ref([]);

// id du projet depuis l’URL
const id = computed(() => String(route.params.id || ""));

/* ===========================
   ✅ Auth / droits
   - Tout le monde peut consulter
   - Edition uniquement si user connecté ET membre du groupe du projet
   =========================== */
const authUser = computed(() => pb.authStore?.model || null);
const authUserId = computed(() => authUser.value?.id || null);

// true si l'utilisateur connecté fait partie du groupe (groupe.membres = ids users)
const isMemberOfGroup = computed(() => {
  const uid = authUserId.value;
  if (!uid) return false;
  const ids = groupe.value?.membres;
  return Array.isArray(ids) ? ids.includes(uid) : false;
});

// droits d'édition
const canEdit = computed(() => isMemberOfGroup.value);

/* ===========================
   ✅ Helpers
   =========================== */
const parcoursLabel = (p) => {
  const s = String(p || "").toLowerCase();
  if (s === "dev") return "Développement";
  if (s === "créa" || s === "crea") return "Design";
  if (s === "com") return "Communication";
  return p || "";
};

const anneeLabel = (a) => {
  const s = String(a || "");
  if (s === "1") return "1ère année";
  if (s === "2") return "2ème année";
  if (s === "3") return "3ème année";
  return s ? `${s}ème année` : "";
};

const userDisplayName = (u) => {
  const prenom = String(u?.prenom || "").trim();
  const nom = String(u?.nom || "").trim();
  const full = `${prenom} ${nom}`.trim();
  return full || u?.name || u?.username || u?.email || "Utilisateur";
};

const initials = (name) => {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "";
  const b = parts[1]?.[0] || "";
  return (a + b).toUpperCase();
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

const memberSubtitle = (u) => {
  const annee = anneeLabel(u?.annee);
  const parcours = parcoursLabel(u?.parcours || u?.specialisation);
  if (annee && parcours) return `${annee} – ${parcours}`;
  return annee || parcours || "";
};

const heroImageUrl = computed(() => {
  if (projet.value?.photo) return pb.files.getURL(projet.value, projet.value.photo);
  if (sujet.value?.image_marque) return pb.files.getURL(sujet.value, sujet.value.image_marque);
  if (projet.value?.apercu) return pb.files.getURL(projet.value, projet.value.apercu);
  return null;
});

const sujetPdfUrl = computed(() => {
  if (!sujet.value?.sujet_pdf) return null;
  return pb.files.getURL(sujet.value, sujet.value.sujet_pdf);
});

const promoBadges = computed(() => {
  const promos = projet.value?.expand?.promo;
  if (!Array.isArray(promos)) return [];
  return promos.map((pr) => ({
    id: pr.id,
    promo: pr.promo,
    annee: pr.annee,
    parcours: pr.parcours,
    presentable: pr.presentable,
  }));
});

const formatDateFr = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long" });
};

// Affiche les membres assignés même si expand ne marche pas
const assignedMembers = (e) => {
  const expanded = e?.expand?.membres;
  if (Array.isArray(expanded) && expanded.length) return expanded;

  const ids = e?.membres;
  if (!Array.isArray(ids) || !ids.length) return [];

  const set = new Set(ids);
  return (membres.value || []).filter((u) => set.has(u.id));
};

// ✅ URL fichier Livrable (champ "fichier")
const livrableFileUrl = (l) => {
  if (!l?.fichier) return null;
  try {
    return pb.files.getURL(l, l.fichier);
  } catch {
    return null;
  }
};

// Timeout pour éviter requêtes qui pendent
const withTimeout = (promise, ms = 15000, label = "Requête") => {
  let t;
  const timeout = new Promise((_, reject) => {
    t = setTimeout(() => reject(new Error(`${label} : délai dépassé (${ms / 1000}s)`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
};

/* ===========================
   ✅ Couverture : upload / update (édition restreinte)
   =========================== */
const coverUploading = ref(false);
const coverError = ref("");
const coverSuccess = ref("");

const onCoverFileChange = async (e) => {
  coverError.value = "";
  coverSuccess.value = "";

  if (!canEdit.value) {
    coverError.value = "Vous n’avez pas les droits pour modifier ce projet.";
    if (e?.target) e.target.value = "";
    return;
  }

  const file = e?.target?.files?.[0];
  if (!file || !projet.value?.id) return;

  if (!file.type.startsWith("image/")) {
    coverError.value = "Le fichier doit être une image (jpg, png, webp...).";
    e.target.value = "";
    return;
  }

  const maxMb = 5;
  if (file.size > maxMb * 1024 * 1024) {
    coverError.value = `Image trop lourde (max ${maxMb} Mo).`;
    e.target.value = "";
    return;
  }

  coverUploading.value = true;

  try {
    const formData = new FormData();
    formData.append("photo", file);

    const updated = await withTimeout(
      pb.collection("Projet").update(projet.value.id, formData),
      15000,
      "Mise à jour couverture"
    );

    projet.value = { ...projet.value, ...updated };
    coverSuccess.value = "Image de couverture mise à jour ✅";
  } catch (err) {
    console.error(err);
    coverError.value = err?.message || "Erreur lors de la mise à jour de l’image";
  } finally {
    coverUploading.value = false;
    e.target.value = "";
  }
};

const removeCover = async () => {
  coverError.value = "";
  coverSuccess.value = "";

  if (!canEdit.value) {
    coverError.value = "Vous n’avez pas les droits pour modifier ce projet.";
    return;
  }

  if (!projet.value?.id) return;
  coverUploading.value = true;

  try {
    const updated = await withTimeout(
      pb.collection("Projet").update(projet.value.id, { photo: null }),
      15000,
      "Suppression couverture"
    );
    projet.value = { ...projet.value, ...updated };
    coverSuccess.value = "Image de couverture supprimée ✅";
  } catch (err) {
    console.error(err);
    coverError.value = err?.message || "Erreur lors de la suppression de l’image";
  } finally {
    coverUploading.value = false;
  }
};

/* ===========================
   ✅ Étapes : fetch + création (édition restreinte)
   =========================== */
const showAddEtape = ref(false);
const creatingEtape = ref(false);
const etapeError = ref("");
const etapeSuccess = ref("");

const etapeForm = ref({
  titre: "",
  description: "",
  date_debut: "",
  date_fin: "",
  statut: "todo", // todo | en_cours | done
  progress: 0, // optionnel (champ number "progress")
  membres: [], // optionnel (champ relation multiple "membres")
});

const reloadEtapes = async () => {
  const projetId = id.value;
  if (!projetId) return;

  etapes.value = await withTimeout(
    pb.collection("Etape").getFullList({
      filter: `id_projet = "${projetId}"`,
      sort: "date_debut",
      expand: "membres",
    }),
    15000,
    "Chargement étapes"
  );
};

const openAddEtape = () => {
  etapeError.value = "";
  etapeSuccess.value = "";

  if (!canEdit.value) {
    etapeError.value = "Vous n’avez pas les droits pour ajouter des étapes sur ce projet.";
    return;
  }
  showAddEtape.value = true;
};

const createEtape = async () => {
  etapeError.value = "";
  etapeSuccess.value = "";

  if (!canEdit.value) {
    etapeError.value = "Vous n’avez pas les droits pour ajouter des étapes sur ce projet.";
    return;
  }

  if (!projet.value?.id) {
    etapeError.value = "Projet introuvable.";
    return;
  }

  if (!String(etapeForm.value.titre || "").trim()) {
    etapeError.value = "Le titre est obligatoire.";
    return;
  }

  const safeProgress = Number.isFinite(Number(etapeForm.value.progress))
    ? Math.max(0, Math.min(100, Number(etapeForm.value.progress)))
    : 0;

  creatingEtape.value = true;

  try {
    await withTimeout(
      pb.collection("Etape").create({
        titre: String(etapeForm.value.titre).trim(),
        description: String(etapeForm.value.description || "").trim(),
        date_debut: etapeForm.value.date_debut || null,
        date_fin: etapeForm.value.date_fin || null,
        statut: etapeForm.value.statut || "todo",
        progress: safeProgress,
        id_projet: projet.value.id,
        membres: Array.isArray(etapeForm.value.membres) ? etapeForm.value.membres : [],
      }),
      15000,
      "Création étape"
    );

    await reloadEtapes();

    etapeSuccess.value = "Étape ajoutée ✅";
    showAddEtape.value = false;

    etapeForm.value = {
      titre: "",
      description: "",
      date_debut: "",
      date_fin: "",
      statut: "todo",
      progress: 0,
      membres: [],
    };
  } catch (err) {
    console.error(err);
    etapeError.value = err?.message || "Erreur lors de la création de l’étape";
  } finally {
    creatingEtape.value = false;
  }
};

/* ===========================
   ✅ Livrables : list + création (édition restreinte)
   - type_fichier : "document" | "lien"
   - fichier (File) pour upload
   - url_fichier pour liens
   =========================== */
const showAddLivrable = ref(false);
const livrableTab = ref("document"); // document | lien
const creatingLivrable = ref(false);
const livrableError = ref("");
const livrableSuccess = ref("");

const livrableForm = ref({
  titre: "",
  version: "",
  url_fichier: "",
  fichier: null,
});

const openAddLivrable = () => {
  livrableError.value = "";
  livrableSuccess.value = "";

  if (!canEdit.value) {
    livrableError.value = "Vous n’avez pas les droits pour ajouter des documents sur ce projet.";
    return;
  }
  showAddLivrable.value = true;
};

const onLivrableFileChange = (e) => {
  livrableForm.value.fichier = e?.target?.files?.[0] || null;
};

// ✅ Affichage : non-membres => uniquement visible=true, membres => tout
const reloadLivrables = async () => {
  const projetId = id.value;
  if (!projetId) return;

  const filter = canEdit.value
    ? `id_projet = "${projetId}"`
    : `id_projet = "${projetId}" && visible = true`;

  livrables.value = await withTimeout(
    pb.collection("Livrable").getFullList({
      filter,
      sort: "-created",
    }),
    15000,
    "Chargement livrables"
  );
};

const createLivrable = async () => {
  livrableError.value = "";
  livrableSuccess.value = "";

  if (!canEdit.value) {
    livrableError.value = "Vous n’avez pas les droits pour ajouter des documents sur ce projet.";
    return;
  }
  if (!projet.value?.id) {
    livrableError.value = "Projet introuvable.";
    return;
  }
  if (!String(livrableForm.value.titre || "").trim()) {
    livrableError.value = "Le titre est obligatoire.";
    return;
  }

  creatingLivrable.value = true;

  try {
    // ✅ LIEN → JSON
    if (livrableTab.value === "lien") {
      if (!String(livrableForm.value.url_fichier || "").trim()) {
        livrableError.value = "L’URL est obligatoire pour un lien.";
        return;
      }

      await withTimeout(
        pb.collection("Livrable").create({
          titre: String(livrableForm.value.titre).trim(),
          type_fichier: "lien",
          url_fichier: String(livrableForm.value.url_fichier).trim(),
          version: String(livrableForm.value.version || "").trim(),
          date_depot: new Date().toISOString().slice(0, 10),
          visible: true,
          id_projet: projet.value.id,
          id_createur: authUserId.value || null,
        }),
        20000,
        "Création livrable (lien)"
      );
    }

    // ✅ DOCUMENT → FormData (upload)
    if (livrableTab.value === "document") {
      if (!livrableForm.value.fichier) {
        livrableError.value = "Veuillez sélectionner un fichier.";
        return;
      }

      const fd = new FormData();
      fd.append("titre", String(livrableForm.value.titre).trim());
      fd.append("type_fichier", "document");
      fd.append("version", String(livrableForm.value.version || "").trim());
      fd.append("date_depot", new Date().toISOString().slice(0, 10));
      fd.append("id_projet", projet.value.id);
      if (authUserId.value) fd.append("id_createur", authUserId.value);
      fd.append("fichier", livrableForm.value.fichier);

      // ⚠️ on met visible via défaut PB ou via update ensuite si besoin
      await withTimeout(pb.collection("Livrable").create(fd), 20000, "Upload livrable (document)");
    }

    await reloadLivrables();

    livrableSuccess.value = "Livrable ajouté ✅";
    showAddLivrable.value = false;
    livrableForm.value = { titre: "", version: "", url_fichier: "", fichier: null };
  } catch (err) {
    console.error("PB ERROR:", err);
    console.error("PB DATA:", err?.data);

    const fieldErrors = err?.data?.data ? JSON.stringify(err.data.data, null, 2) : "";
    const msg = err?.data?.message || err?.message || "Erreur PocketBase";

    livrableError.value = fieldErrors ? `${msg}\n${fieldErrors}` : msg;
  } finally {
    creatingLivrable.value = false;
  }
};

/* ===========================
   ✅ Mounted : charger projet + groupe/membres + étapes + livrables
   =========================== */
onMounted(async () => {
  const projetId = id.value;
  if (!projetId) {
    error.value = "ID du projet manquant dans l’URL.";
    loading.value = false;
    return;
  }

  try {
    // Projet consultable par tous
    projet.value = await withTimeout(
      pb.collection("Projet").getOne(projetId, { expand: "promo,sujet" }),
      15000,
      "Chargement projet"
    );

    sujet.value = projet.value?.expand?.sujet || null;

    // Groupe (si présent)
    const groupeId = projet.value?.groupe;

    if (groupeId) {
      groupe.value = await withTimeout(pb.collection("Groupe").getOne(groupeId), 15000, "Chargement groupe");

      // Membres du groupe (pour affichage + fallback assignation)
      if (Array.isArray(groupe.value?.membres) && groupe.value.membres.length > 0) {
        const orFilter = groupe.value.membres.map((uid) => `id="${uid}"`).join(" || ");
        membres.value = await withTimeout(
          pb.collection("users").getFullList({
            filter: orFilter,
            sort: "created",
          }),
          15000,
          "Chargement membres"
        );
      } else {
        membres.value = [];
      }
    } else {
      groupe.value = null;
      membres.value = [];
    }

    // Étapes consultables par tous
    await reloadEtapes();

    // Livrables (filtrés selon canEdit)
    await reloadLivrables();
  } catch (err) {
    console.error(err);
    error.value = err?.message || "Erreur lors du chargement du projet";
  } finally {
    loading.value = false;
  }
});
</script>


<template>
  <div class="min-h-screen bg-[#151A24] text-white">
    <AppHeader variant="transparent" />

    <!-- LOADING / ERROR -->
    <div v-if="loading" class="max-w-6xl mx-auto px-6 py-10 text-white/70">
      Chargement...
    </div>

    <div v-else-if="error" class="max-w-6xl mx-auto px-6 py-10 text-red-300">
      {{ error }}
    </div>

    <template v-else>
      <!-- HERO -->
      <section class="relative">
        <div class="h-[500px] w-full overflow-hidden">
          <img
            v-if="heroImageUrl"
            :src="heroImageUrl"
            alt="Visuel du projet"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full bg-gradient-to-br from-white/10 to-black/50" />
        </div>

        <div class="absolute inset-0 bg-black/55" />

        <div class="absolute inset-0">
          <div class="max-w-6xl mx-auto px-6 pt-48">
            <button class="text-[#CFFFBC] hover:underline" @click="$router.back()">
              ← Retour
            </button>

            <!-- Badge droits -->
            <div class="mt-4">
              <span
                v-if="canEdit"
                class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#CFFFBC]/15 border border-[#CFFFBC]/25 text-sm text-[#CFFFBC] font-semibold"
              >
                ✔️ Vous pouvez modifier ce projet
              </span>
              <span
                v-else
                class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-sm text-white/70 font-semibold"
              >
                👀 Lecture seule
              </span>
            </div>

            <!-- Actions couverture (uniquement si canEdit) -->
            <div v-if="canEdit" class="mt-6 flex items-center gap-3 flex-wrap">
              <label
                class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 hover:bg-white/15 transition cursor-pointer"
              >
                <span class="text-sm font-semibold text-white">
                  {{ coverUploading ? "Upload..." : "Changer la couverture" }}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  :disabled="coverUploading"
                  @change="onCoverFileChange"
                />
              </label>

              <button
                v-if="projet?.photo"
                class="px-4 py-2 rounded-full bg-red-500/15 border border-red-300/20 hover:bg-red-500/20 transition text-sm font-semibold text-red-200"
                :disabled="coverUploading"
                @click="removeCover"
              >
                Retirer
              </button>

              <p v-if="coverError" class="text-sm text-red-300">{{ coverError }}</p>
              <p v-else-if="coverSuccess" class="text-sm text-[#CFFFBC]">{{ coverSuccess }}</p>
            </div>

            <p v-else-if="coverError" class="mt-6 text-sm text-red-300">{{ coverError }}</p>

            <div class="mt-12 max-w-2xl">
              <h1 class="text-4xl md:text-5xl font-extrabold text-[#CFFFBC] leading-tight">
                {{ projet?.titre || "(Sans titre)" }}
              </h1>

              <p class="mt-3 text-white/80 text-sm">
                <span class="font-semibold">Commanditaire :</span>
                {{
                  projet?.expand?.commanditaire?.name
                  || projet?.expand?.commanditaire?.username
                  || projet?.expand?.commanditaire?.email
                  || "Non renseigné"
                }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- CONTENT PANEL -->
      <section class="max-w-6xl mx-auto px-6 mt-12 pb-16">
        <div class="rounded-3xl bg-[#1B2130] border border-white/10 shadow-xl p-8">
          <!-- DESCRIPTION -->
          <div class="text-white/85 leading-relaxed whitespace-pre-line">
            {{ sujet?.description || "Aucune description." }}
          </div>

          <!-- GROUPE -->
          <section class="mt-10">
            <div class="flex items-end justify-between gap-4 flex-wrap">
              <h2 class="text-xl font-extrabold text-white">Membres du groupe</h2>

              <p v-if="groupe" class="text-white/50 text-sm">
                {{ membres.length }} membre{{ membres.length > 1 ? "s" : "" }}
              </p>
            </div>

            <div
              v-if="!groupe"
              class="mt-4 rounded-2xl border border-white/10 bg-black/20 p-5 text-white/70"
            >
              Aucun groupe n’est encore attribué à ce projet.
            </div>

            <div v-else class="mt-4">
              <div
                v-if="membres.length"
                class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                <div
                  v-for="m in membres"
                  :key="m.id"
                  class="rounded-xl bg-white/5 border border-white/10 p-5 flex flex-col items-center text-center"
                >
                  <div
                    class="w-16 h-16 rounded-full overflow-hidden border border-white/10 bg-white/5 grid place-items-center"
                  >
                    <img
                      v-if="userAvatarUrl(m)"
                      :src="userAvatarUrl(m)"
                      alt=""
                      class="w-full h-full object-cover"
                    />
                    <span v-else class="text-sm font-extrabold text-white/70">
                      {{ initials(userDisplayName(m)) }}
                    </span>
                  </div>

                  <p class="mt-3 font-extrabold text-white leading-tight">
                    {{ userDisplayName(m) }}
                  </p>

                  <p v-if="memberSubtitle(m)" class="mt-1 text-sm text-white/60">
                    {{ memberSubtitle(m) }}
                  </p>
                </div>
              </div>

              <div
                v-else
                class="rounded-2xl border border-white/10 bg-black/20 p-5 text-white/70"
              >
                Le groupe existe, mais aucun membre n’est associé.
              </div>
            </div>
          </section>

          <!-- PROMOS -->
          <div v-if="promoBadges.length" class="mt-8">
            <h2 class="font-bold text-white mb-3">Parcours concernés</h2>
            <div class="flex flex-wrap gap-3">
              <span
                v-for="b in promoBadges"
                :key="b.id"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-white/85"
              >
                <span class="font-semibold text-[#CFFFBC]">
                  {{ anneeLabel(b.annee) }}
                </span>
                <span class="opacity-70">•</span>
                <span>{{ parcoursLabel(b.parcours) }}</span>
                <span v-if="b.promo" class="opacity-60">({{ b.promo }})</span>
              </span>
            </div>
          </div>

          <!-- GRID: compétences + ressources -->
          <div class="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div>
              <h2 class="font-bold text-white mb-4">Compétences mobilisées</h2>

              <div
                v-if="(sujet?.competences || []).length"
                class="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                <div
                  v-for="c in sujet.competences"
                  :key="c"
                  class="rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-sm text-white/85"
                >
                  {{ c }}
                </div>
              </div>

              <p v-else class="text-white/60 text-sm">Aucune compétence renseignée.</p>
            </div>

            <div>
              <h2 class="font-bold text-white mb-4">Ressource</h2>

              <a
                v-if="sujetPdfUrl"
                :href="sujetPdfUrl"
                target="_blank"
                rel="noreferrer"
                class="w-44 h-32 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition flex flex-col items-center justify-center gap-3"
              >
                <div
                  class="w-10 h-10 rounded-lg bg-[#CFFFBC]/10 flex items-center justify-center"
                >
                  <span class="text-[#CFFFBC] text-2xl leading-none">📄</span>
                </div>
                <span class="text-[#CFFFBC] font-semibold">Sujet</span>
              </a>

              <p v-else class="text-white/60 text-sm">Aucun PDF fourni.</p>
            </div>
          </div>

          <!-- LIENS & DOCUMENTS (Livrables) -->
          <section class="mt-12">
            <div class="flex items-end justify-between gap-4 flex-wrap">
              <h2 class="text-xl font-extrabold text-white">Liens et documents</h2>

              <button
                v-if="canEdit"
                class="px-4 py-2 rounded-xl border border-white/20 text-white/70 hover:bg-white/10 transition"
                @click="openAddLivrable"
              >
                + Ajouter un document
              </button>
            </div>

            <p v-if="livrableError && !showAddLivrable" class="mt-3 text-sm text-red-300">
              {{ livrableError }}
            </p>

            <div v-if="livrables.length" class="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <a
                v-for="l in livrables"
                :key="l.id"
                :href="l.type_fichier === 'lien' ? l.url_fichier : (livrableFileUrl(l) || '#')"
                target="_blank"
                rel="noreferrer"
                class="rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition p-5 flex items-center gap-4"
              >
                <div class="w-12 h-12 rounded-xl bg-[#CFFFBC]/10 grid place-items-center text-xl">
                  <span v-if="l.type_fichier === 'lien'">🔗</span>
                  <span v-else>📄</span>
                </div>

                <div class="min-w-0">
                  <p class="font-extrabold text-[#CFFFBC] truncate">
                    {{ l.titre }}
                  </p>
                  <p class="text-sm text-white/60">
                    Version : {{ l.version || "—" }}
                  </p>
                </div>
              </a>
            </div>

            <div
              v-else
              class="mt-4 rounded-2xl border border-white/10 bg-black/20 p-5 text-white/70"
            >
              Aucun livrable pour le moment.
            </div>

            <!-- MODAL AJOUT LIVRABLE -->
            <div
              v-if="showAddLivrable"
              class="fixed inset-0 z-50 bg-black/60 grid place-items-center px-6"
            >
              <div class="w-full max-w-lg rounded-3xl bg-[#1B2130] border border-white/10 shadow-xl p-7">
                <div class="flex items-start justify-between gap-4">
                  <h3 class="text-lg font-extrabold text-white">Ajouter un document</h3>

                  <button class="text-white/60 hover:text-white" @click="showAddLivrable = false">
                    ✕
                  </button>
                </div>

                <!-- Tabs -->
                <div class="mt-5 flex items-center gap-2 rounded-xl bg-black/20 border border-white/10 p-1">
                  <button
                    class="flex-1 py-2 rounded-lg text-sm font-extrabold"
                    :class="livrableTab === 'document' ? 'bg-[#CFFFBC] text-black' : 'text-white/70 hover:text-white'"
                    @click="livrableTab = 'document'"
                    type="button"
                  >
                    Document
                  </button>
                  <button
                    class="flex-1 py-2 rounded-lg text-sm font-extrabold"
                    :class="livrableTab === 'lien' ? 'bg-[#CFFFBC] text-black' : 'text-white/70 hover:text-white'"
                    @click="livrableTab = 'lien'"
                    type="button"
                  >
                    Lien
                  </button>
                </div>

                <div class="mt-5 space-y-4">
                  <div>
                    <label class="text-sm text-white/70">Titre</label>
                    <input
                      v-model="livrableForm.titre"
                      class="mt-1 w-full rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/25"
                      placeholder="Ex : Maquette mobile"
                    />
                  </div>

                  <div>
                    <label class="text-sm text-white/70">Version (optionnel)</label>
                    <input
                      v-model="livrableForm.version"
                      class="mt-1 w-full rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/25"
                      placeholder="Ex : v1 / v2 / finale"
                    />
                  </div>

                  <!-- DOCUMENT -->
                  <div v-if="livrableTab === 'document'">
                    <label class="text-sm text-white/70">Fichier</label>

                    <label
                      class="mt-2 block rounded-2xl border border-white/15 bg-black/20 p-6 text-center cursor-pointer hover:bg-black/25 transition"
                    >
                      <div class="text-5xl">📥</div>
                      <p class="mt-2 text-white/80 font-semibold">
                        Déposez le fichier pour le téléverser
                      </p>
                      <p class="text-sm text-white/60 underline">
                        Naviguer dans les fichiers
                      </p>

                      <input type="file" class="hidden" @change="onLivrableFileChange" />

                      <p v-if="livrableForm.fichier" class="mt-3 text-sm text-[#CFFFBC]">
                        Sélectionné : {{ livrableForm.fichier.name }}
                      </p>
                    </label>

                    <p class="mt-2 text-xs text-white/50">
                      ⚠️ Il faut un champ <span class="font-semibold text-white/70">File</span> nommé
                      <span class="font-semibold text-white/70">fichier</span> dans la collection Livrable.
                    </p>
                  </div>

                  <!-- LIEN -->
                  <div v-else>
                    <label class="text-sm text-white/70">URL</label>
                    <input
                      v-model="livrableForm.url_fichier"
                      class="mt-1 w-full rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/25"
                      placeholder="https://..."
                    />
                  </div>

                  <p v-if="livrableError" class="text-sm text-red-300">{{ livrableError }}</p>
                  <p v-else-if="livrableSuccess" class="text-sm text-[#CFFFBC]">{{ livrableSuccess }}</p>

                  <div class="pt-2 flex items-center justify-end gap-3">
                    <button
                      class="px-4 py-2 rounded-full bg-white/10 border border-white/15 hover:bg-white/15 transition text-sm font-semibold text-white"
                      :disabled="creatingLivrable"
                      @click="showAddLivrable = false"
                    >
                      Annuler
                    </button>

                    <button
                      class="px-4 py-2 rounded-full bg-[#CFFFBC]/20 border border-[#CFFFBC]/30 hover:bg-[#CFFFBC]/25 transition text-sm font-extrabold text-[#CFFFBC]"
                      :disabled="creatingLivrable"
                      @click="createLivrable"
                    >
                      {{ creatingLivrable ? "Envoi..." : "Enregistrer les modifications" }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <!-- LIENS ET DOCUMENTS -->
<section class="mt-12">
  <div class="flex items-center justify-between gap-4 flex-wrap">
    <h2 class="text-xl font-extrabold text-white">Liens et documents</h2>

    <button
      v-if="canEdit"
      class="px-4 py-2 rounded-xl bg-white/5 border border-white/15 hover:bg-white/10 transition text-sm font-semibold text-white/80"
      @click="openAddLivrable"
    >
      + Ajouter un document
    </button>

    <span v-else class="text-sm text-white/55">
      Lecture seule (ajout réservé aux membres du groupe)
    </span>
  </div>

  <!-- Liste -->
  <div v-if="livrables.length" class="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    <a
      v-for="l in livrables"
      :key="l.id"
      :href="l.type_fichier === 'lien' ? l.url_fichier : livrableFileUrl(l)"
      target="_blank"
      rel="noreferrer"
      class="rounded-2xl bg-[#2B3140] border border-white/10 hover:border-white/20 transition p-5 flex items-center gap-4"
    >
      <div class="w-12 h-12 rounded-xl bg-[#CFFFBC]/10 grid place-items-center text-2xl">
        {{ livrableIcon(l) }}
      </div>

      <div class="min-w-0">
        <p class="font-extrabold text-[#CFFFBC] truncate">
          {{ l.titre }}
        </p>
        <p class="text-sm text-white/60 truncate">
          <span v-if="l.version">Version : {{ l.version }}</span>
          <span v-else>Aucune version</span>
        </p>
        <p class="text-sm text-white/50">
          {{ l.type_fichier === "lien" ? "Lien" : "Document" }}
        </p>
      </div>
    </a>
  </div>

  <!-- Empty state -->
  <div
    v-else
    class="mt-4 rounded-2xl border border-white/10 bg-black/20 p-5 text-white/70"
  >
    Aucun livrable pour le moment.
  </div>

  <!-- MODAL : Ajouter un livrable -->
  <div
    v-if="showAddLivrable"
    class="fixed inset-0 z-50 bg-black/60 grid place-items-center px-6"
  >
    <div class="w-full max-w-xl rounded-3xl bg-[#1B2130] border border-white/10 shadow-xl p-7">
      <div class="flex items-start justify-between gap-4">
        <h3 class="text-lg font-extrabold text-white">Ajouter un document</h3>

        <button class="text-white/60 hover:text-white" @click="showAddLivrable = false">
          ✕
        </button>
      </div>

      <!-- Tabs -->
      <div class="mt-5 rounded-2xl bg-white/5 border border-white/10 p-1 flex">
        <button
          class="flex-1 py-2 rounded-xl text-sm font-extrabold transition"
          :class="livrableTab === 'document' ? 'bg-[#CFFFBC] text-[#151A24]' : 'text-white/70 hover:text-white'"
          @click="livrableTab = 'document'"
        >
          Document
        </button>
        <button
          class="flex-1 py-2 rounded-xl text-sm font-extrabold transition"
          :class="livrableTab === 'lien' ? 'bg-[#CFFFBC] text-[#151A24]' : 'text-white/70 hover:text-white'"
          @click="livrableTab = 'lien'"
        >
          Lien
        </button>
      </div>

      <div class="mt-5 space-y-4">
        <div>
          <label class="text-sm text-white/70">Titre</label>
          <input
            v-model="livrableForm.titre"
            class="mt-1 w-full rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/25"
            placeholder="Ex : Maquette"
          />
        </div>

        <div>
          <label class="text-sm text-white/70">Version (optionnel)</label>
          <input
            v-model="livrableForm.version"
            class="mt-1 w-full rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/25"
            placeholder="Ex : v1"
          />
        </div>

        <!-- Document -->
        <div v-if="livrableTab === 'document'">
          <label class="text-sm text-white/70">Fichier</label>

          <div class="mt-2 rounded-2xl bg-black/20 border border-white/10 p-5 text-center">
            <div class="text-3xl">📥</div>
            <p class="mt-2 text-white/80 font-semibold">Déposez le fichier pour le téléverser</p>
            <p class="text-sm text-white/60 underline">Naviguer dans les fichiers</p>

            <input
              type="file"
              class="mt-4 block w-full text-sm text-white/70"
              @change="onLivrableFileChange"
            />

            <p v-if="livrableForm.fichier" class="mt-3 text-sm text-[#CFFFBC] font-semibold">
              Sélectionné : {{ livrableForm.fichier.name }}
            </p>
          </div>
        </div>

        <!-- Lien -->
        <div v-else>
          <label class="text-sm text-white/70">URL</label>
          <input
            v-model="livrableForm.url_fichier"
            class="mt-1 w-full rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/25"
            placeholder="https://..."
          />
        </div>

        <p v-if="livrableError" class="text-sm text-red-300 whitespace-pre-wrap">{{ livrableError }}</p>
        <p v-else-if="livrableSuccess" class="text-sm text-[#CFFFBC]">{{ livrableSuccess }}</p>

        <div class="pt-2 flex items-center justify-end gap-3">
          <button
            class="px-4 py-2 rounded-full bg-white/10 border border-white/15 hover:bg-white/15 transition text-sm font-semibold text-white"
            :disabled="creatingLivrable"
            @click="showAddLivrable = false"
          >
            Annuler
          </button>

          <button
            class="px-4 py-2 rounded-full bg-[#CFFFBC]/20 border border-[#CFFFBC]/30 hover:bg-[#CFFFBC]/25 transition text-sm font-extrabold text-[#CFFFBC]"
            :disabled="creatingLivrable"
            @click="createLivrable"
          >
            {{ creatingLivrable ? "Enregistrement..." : "Enregistrer les modifications" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</section>

          <!-- TO DO LIST -->
          <section class="mt-12">
            <div class="flex items-center justify-between gap-4 flex-wrap">
              <h2 class="text-xl font-extrabold text-white">To do list</h2>

              <button
                v-if="canEdit"
                class="px-4 py-2 rounded-full bg-[#CFFFBC]/15 border border-[#CFFFBC]/25 hover:bg-[#CFFFBC]/20 transition text-sm font-semibold text-[#CFFFBC]"
                @click="openAddEtape"
              >
                + Ajouter une étape
              </button>

              <span v-else class="text-sm text-white/55">
                Vous pouvez consulter les étapes (édition réservée aux membres du groupe)
              </span>
            </div>

            <p v-if="etapeError && !showAddEtape" class="mt-3 text-sm text-red-300">
              {{ etapeError }}
            </p>

            <div v-if="etapes.length" class="mt-5 flex gap-4 overflow-x-auto pb-3">
              <article
                v-for="e in etapes"
                :key="e.id"
                class="min-w-[320px] max-w-[360px] rounded-2xl bg-[#2B3140] border border-white/10 overflow-hidden"
              >
                <div class="p-5">
                  <div class="flex items-start justify-between gap-4">
                    <h3 class="text-lg font-extrabold text-[#CFFFBC] leading-tight">
                      {{ e.titre }}
                    </h3>

                    <div
                      v-if="typeof e.progress === 'number'"
                      class="text-3xl font-extrabold text-[#CFFFBC]"
                    >
                      {{ e.progress }}%
                    </div>
                  </div>

                  <div class="mt-3 flex items-center gap-2 flex-wrap">
                    <template v-for="u in assignedMembers(e)" :key="u.id">
                      <div
                        class="w-7 h-7 rounded-full overflow-hidden border border-white/10 bg-white/5 grid place-items-center"
                        title="Assigné"
                      >
                        <img
                          v-if="userAvatarUrl(u)"
                          :src="userAvatarUrl(u)"
                          alt=""
                          class="w-full h-full object-cover"
                        />
                        <span v-else class="text-[10px] font-extrabold text-white/70">
                          {{ initials(userDisplayName(u)) }}
                        </span>
                      </div>
                    </template>

                    <span v-if="!assignedMembers(e).length" class="text-white/50 text-sm">
                      Aucun membre assigné
                    </span>
                  </div>

                  <p class="mt-3 text-sm text-white/60">
                    Statut :
                    <span class="text-white/80 font-semibold">{{ e.statut || "—" }}</span>
                  </p>
                </div>

                <div v-if="typeof e.progress === 'number'" class="h-2 bg-black/30">
                  <div
                    class="h-full bg-[#CFFFBC]"
                    :style="{ width: `${Math.max(0, Math.min(100, e.progress))}%` }"
                  />
                </div>

                <div
                  v-if="e.date_fin"
                  class="px-5 py-3 bg-red-600/90 text-red-50 text-sm font-semibold flex items-center gap-2"
                >
                  ⏱️ A finir pour le {{ formatDateFr(e.date_fin) }}
                </div>
              </article>
            </div>

            <div
              v-else
              class="mt-4 rounded-2xl border border-white/10 bg-black/20 p-5 text-white/70"
            >
              Aucune étape pour le moment.
            </div>

            <!-- MODAL création étape -->
            <div
              v-if="showAddEtape"
              class="fixed inset-0 z-50 bg-black/60 grid place-items-center px-6"
            >
              <div class="w-full max-w-xl rounded-3xl bg-[#1B2130] border border-white/10 shadow-xl p-7">
                <div class="flex items-start justify-between gap-4">
                  <h3 class="text-lg font-extrabold text-white">Ajouter une étape</h3>

                  <button class="text-white/60 hover:text-white" @click="showAddEtape = false">
                    ✕
                  </button>
                </div>

                <div class="mt-5 space-y-4">
                  <div>
                    <label class="text-sm text-white/70">Titre</label>
                    <input
                      v-model="etapeForm.titre"
                      class="mt-1 w-full rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/25"
                      placeholder="Ex : Faire la maquette mobile"
                    />
                  </div>

                  <div>
                    <label class="text-sm text-white/70">Description (optionnel)</label>
                    <textarea
                      v-model="etapeForm.description"
                      class="mt-1 w-full min-h-[90px] rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/25"
                      placeholder="Détails..."
                    />
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label class="text-sm text-white/70">Date début</label>
                      <input
                        v-model="etapeForm.date_debut"
                        type="date"
                        class="mt-1 w-full rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/25"
                      />
                    </div>

                    <div>
                      <label class="text-sm text-white/70">Date fin</label>
                      <input
                        v-model="etapeForm.date_fin"
                        type="date"
                        class="mt-1 w-full rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/25"
                      />
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label class="text-sm text-white/70">Statut</label>
                      <select
                        v-model="etapeForm.statut"
                        class="mt-1 w-full rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/25"
                      >
                        <option value="todo">À faire</option>
                        <option value="en_cours">En cours</option>
                        <option value="done">Terminé</option>
                      </select>
                    </div>

                    <div>
                      <label class="text-sm text-white/70">Progress (%)</label>
                      <input
                        v-model.number="etapeForm.progress"
                        type="number"
                        min="0"
                        max="100"
                        class="mt-1 w-full rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/25"
                      />
                    </div>
                  </div>

                  <div>
                    <label class="text-sm text-white/70">Assigner des membres (optionnel)</label>

                    <div v-if="membres.length" class="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label
                        v-for="u in membres"
                        :key="u.id"
                        class="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-4 py-3 cursor-pointer hover:bg-white/10"
                      >
                        <input
                          type="checkbox"
                          class="accent-[#CFFFBC]"
                          :value="u.id"
                          v-model="etapeForm.membres"
                        />

                        <div
                          class="w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-white/5 grid place-items-center"
                        >
                          <img
                            v-if="userAvatarUrl(u)"
                            :src="userAvatarUrl(u)"
                            alt=""
                            class="w-full h-full object-cover"
                          />
                          <span v-else class="text-[10px] font-extrabold text-white/70">
                            {{ initials(userDisplayName(u)) }}
                          </span>
                        </div>

                        <span class="text-sm text-white/85 font-semibold">
                          {{ userDisplayName(u) }}
                        </span>
                      </label>
                    </div>

                    <p v-else class="mt-2 text-sm text-white/50">
                      Aucun membre trouvé dans le groupe.
                    </p>
                  </div>

                  <p v-if="etapeError" class="text-sm text-red-300">{{ etapeError }}</p>
                  <p v-else-if="etapeSuccess" class="text-sm text-[#CFFFBC]">{{ etapeSuccess }}</p>

                  <div class="pt-2 flex items-center justify-end gap-3">
                    <button
                      class="px-4 py-2 rounded-full bg-white/10 border border-white/15 hover:bg-white/15 transition text-sm font-semibold text-white"
                      :disabled="creatingEtape"
                      @click="showAddEtape = false"
                    >
                      Annuler
                    </button>

                    <button
                      class="px-4 py-2 rounded-full bg-[#CFFFBC]/20 border border-[#CFFFBC]/30 hover:bg-[#CFFFBC]/25 transition text-sm font-extrabold text-[#CFFFBC]"
                      :disabled="creatingEtape"
                      @click="createEtape"
                    >
                      {{ creatingEtape ? "Création..." : "Créer l’étape" }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </template>
  </div>
</template>
