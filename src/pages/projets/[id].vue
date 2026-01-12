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
// promo = relation multiple vers Promotion, donc on prend expand.promo[]
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

    // 3) Étapes liées au projet
    etapes.value = await pb.collection("Etape").getFullList({
      filter: `id_projet = "${projetId}"`,
      sort: "date_debut",
    });

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
            <button
              class="text-[#CFFFBC] hover:underline"
              @click="$router.back()"
            >
              ← Retour
            </button>

            <div class="mt-12 max-w-2xl">
              <h1
                class="text-4xl md:text-5xl font-extrabold text-[#CFFFBC] leading-tight"
              >
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
        <div
          class="rounded-3xl bg-[#1B2130] border border-white/10 shadow-xl p-8"
        >
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

          <!-- (optionnel) Étapes - si tu veux les afficher plus bas -->
          <!--
          <div class="mt-12">
            <h2 class="text-xl font-extrabold text-white mb-4">Étapes</h2>
            <div v-if="etapes.length" class="space-y-3">
              <div
                v-for="e in etapes"
                :key="e.id"
                class="rounded-xl bg-white/5 border border-white/10 p-5"
              >
                <p class="font-bold text-white">{{ e.titre }}</p>
                <p class="text-white/70 text-sm mt-1 whitespace-pre-line">{{ e.description }}</p>
              </div>
            </div>
            <p v-else class="text-white/60 text-sm">Aucune étape pour le moment.</p>
          </div>
          -->
        </div>
      </section>
    </template>
  </div>
</template>

