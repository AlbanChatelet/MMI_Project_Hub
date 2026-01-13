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

// id du projet depuis l’URL
const id = computed(() => String(route.params.id || ""));

// --- helpers labels ---
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

// --- user helpers (affichage groupe) ---
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

// adapte si ton champ avatar s’appelle autrement dans users (avatar/photo/image)
const userAvatarUrl = (u) => {
  if (!u) return null;
  const file = u.avatar || u.photo || u.image;
  if (!file) return null;
  try {
    return pb.files.getUrl(u, file);
  } catch {
    return null;
  }
};

// Sous-texte : "3ème année – Design" (si tu as annee/parcours dans users)
const memberSubtitle = (u) => {
  const annee = anneeLabel(u?.annee);
  const parcours = parcoursLabel(u?.parcours || u?.specialisation);
  if (annee && parcours) return `${annee} – ${parcours}`;
  return annee || parcours || "";
};

// --- files URLs ---
const heroImageUrl = computed(() => {
  // priorité : photo projet
  if (projet.value?.photo) return pb.files.getUrl(projet.value, projet.value.photo);

  // fallback : image_marque du sujet (si tu veux)
  if (sujet.value?.image_marque) return pb.files.getUrl(sujet.value, sujet.value.image_marque);

  // dernier fallback : apercu si tu as encore ce champ
  if (projet.value?.apercu) return pb.files.getUrl(projet.value, projet.value.apercu);

  return null;
});

const sujetPdfUrl = computed(() => {
  if (!sujet.value?.sujet_pdf) return null;
  return pb.files.getUrl(sujet.value, sujet.value.sujet_pdf);
});

// --- promo chips (année + parcours) ---
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

/* ===========================
   ✅ Couverture : upload / update
   =========================== */
const coverUploading = ref(false);
const coverError = ref("");
const coverSuccess = ref("");

const onCoverFileChange = async (e) => {
  coverError.value = "";
  coverSuccess.value = "";

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

    const updated = await pb.collection("Projet").update(projet.value.id, formData);
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
  if (!projet.value?.id) return;
  coverError.value = "";
  coverSuccess.value = "";
  coverUploading.value = true;

  try {
    const updated = await pb.collection("Projet").update(projet.value.id, { photo: null });
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
   ✅ Étapes : création + assignation membres
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
  statut: "todo", // adapte si besoin
  progress: 0, // nécessite un champ number "progress" dans Etape (optionnel)
  membres: [], // nécessite un champ relation multiple "membres" dans Etape
});

const formatDateFr = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long" });
};

const reloadEtapes = async () => {
  const projetId = id.value;
  etapes.value = await pb.collection("Etape").getFullList({
    filter: `id_projet = "${projetId}"`,
    sort: "date_debut",
    expand: "membres",
  });
};

const createEtape = async () => {
  etapeError.value = "";
  etapeSuccess.value = "";

  if (!projet.value?.id) return;

  if (!etapeForm.value.titre.trim()) {
    etapeError.value = "Le titre est obligatoire.";
    return;
  }

  creatingEtape.value = true;

  try {
    await pb.collection("Etape").create({
      titre: etapeForm.value.titre.trim(),
      description: etapeForm.value.description?.trim() || "",
      date_debut: etapeForm.value.date_debut || null,
      date_fin: etapeForm.value.date_fin || null,
      statut: etapeForm.value.statut || "todo",
      progress: Number(etapeForm.value.progress || 0),
      id_projet: projet.value.id,
      membres: etapeForm.value.membres || [],
    });

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

onMounted(async () => {
  const projetId = id.value;
  if (!projetId) {
    error.value = "ID du projet manquant dans l’URL.";
    loading.value = false;
    return;
  }

  try {
    // 1) Projet + expand promo + sujet
    projet.value = await pb.collection("Projet").getOne(projetId, {
      expand: "promo,sujet",
    });

    // 2) Sujet via expand (relation Projet.sujet -> sujets)
    sujet.value = projet.value?.expand?.sujet || null;

    // 3) Étapes liées au projet (avec membres assignés)
    await reloadEtapes();

    // 4) Groupe lié au projet
    const groupeId = projet.value.groupe;

    if (groupeId) {
      groupe.value = await pb.collection("Groupe").getOne(groupeId);

      // 5) Membres du groupe
      if (Array.isArray(groupe.value.membres) && groupe.value.membres.length > 0) {
        const orFilter = groupe.value.membres.map((uid) => `id="${uid}"`).join(" || ");
        membres.value = await pb.collection("users").getFullList({
          filter: orFilter,
          sort: "created",
        });
      } else {
        membres.value = [];
      }
    } else {
      groupe.value = null;
      membres.value = [];
    }
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
          <div
            v-else
            class="w-full h-full bg-gradient-to-br from-white/10 to-black/50"
          />
        </div>

        <!-- dark overlay -->
        <div class="absolute inset-0 bg-black/55" />

        <!-- top content -->
        <div class="absolute inset-0">
          <div class="max-w-6xl mx-auto px-6 pt-48">
            <button class="text-[#CFFFBC] hover:underline" @click="$router.back()">
              ← Retour
            </button>

            <!-- Actions couverture -->
            <div class="mt-6 flex items-center gap-3 flex-wrap">
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

              <p v-if="coverError" class="text-sm text-red-300">
                {{ coverError }}
              </p>
              <p v-else-if="coverSuccess" class="text-sm text-[#CFFFBC]">
                {{ coverSuccess }}
              </p>
            </div>

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
          <!-- DESCRIPTION (depuis la collection sujets) -->
          <div class="text-white/85 leading-relaxed whitespace-pre-line">
            {{ sujet?.description || "Aucune description." }}
          </div>

          <!-- GROUPE -->
          <section class="mt-10">
            <div class="flex items-end justify-between gap-4 flex-wrap">
              <h2 class="text-xl font-extrabold text-white">
                Membres du groupe
              </h2>

              <p v-if="groupe" class="text-white/50 text-sm">
                {{ membres.length }} membre{{ membres.length > 1 ? "s" : "" }}
              </p>
            </div>

            <!-- Aucun groupe -->
            <div
              v-if="!groupe"
              class="mt-4 rounded-2xl border border-white/10 bg-black/20 p-5 text-white/70"
            >
              Aucun groupe n’est encore attribué à ce projet.
            </div>

            <!-- Groupe OK -->
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
                  <!-- Avatar -->
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

                  <!-- Nom -->
                  <p class="mt-3 font-extrabold text-white leading-tight">
                    {{ userDisplayName(m) }}
                  </p>

                  <!-- Sous-texte -->
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

          <!-- PROMOS (année/parcours) -->
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
            <!-- Compétences (depuis la collection sujets) -->
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

              <p v-else class="text-white/60 text-sm">
                Aucune compétence renseignée.
              </p>
            </div>

            <!-- Ressource (carte style maquette) -->
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

              <p v-else class="text-white/60 text-sm">
                Aucun PDF fourni.
              </p>
            </div>
          </div>

          <!-- TO DO LIST -->
          <section class="mt-12">
            <div class="flex items-center justify-between gap-4 flex-wrap">
              <h2 class="text-xl font-extrabold text-white">To do list</h2>

              <button
                class="px-4 py-2 rounded-full bg-[#CFFFBC]/15 border border-[#CFFFBC]/25 hover:bg-[#CFFFBC]/20 transition text-sm font-semibold text-[#CFFFBC]"
                @click="showAddEtape = true"
              >
                + Ajouter une étape
              </button>
            </div>

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

                    <div v-if="typeof e.progress === 'number'" class="text-3xl font-extrabold text-[#CFFFBC]">
                      {{ e.progress }}%
                    </div>
                  </div>

                  <div class="mt-3 flex items-center gap-2 flex-wrap">
                    <template v-for="u in (e.expand?.membres || [])" :key="u.id">
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

                    <span v-if="!(e.expand?.membres || []).length" class="text-white/50 text-sm">
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
