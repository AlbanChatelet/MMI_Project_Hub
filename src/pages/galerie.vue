<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ref, onMounted, computed } from "vue";
import { pb } from "../pb";
import AppHeader from "@/components/AppHeader.vue";

const projets = ref([]);
const promotionsById = ref({}); // cache Promotions utilisées par les projets
const loading = ref(true);
const error = ref(null);

// Filtres (liés)
const selectedAnnee = ref("");     // "" | "1" | "2" | "3"
const selectedParcours = ref("");  // "" | "dev" | "créa" | "com"

// labels
const parcoursLabel = (parcours) => {
  const map = { dev: "Développement", "créa": "Design", crea: "Design", com: "Communication" };
  return map[parcours] || parcours;
};
const anneeLabel = (annee) => {
  const a = String(annee);
  if (a === "1") return "1ère année";
  if (a === "2") return "2ème année";
  if (a === "3") return "3ème année";
  return `${a}ème année`;
};

// url image projet (champ "photo")
const projetPhotoUrl = (projet) => {
  if (!projet?.photo) return null;
  return pb.files.getUrl(projet, projet.photo);
};

onMounted(async () => {
  try {
    // 1) récupère tous les projets
    const projetsRes = await pb.collection("Projet").getFullList({
      sort: "-created",
    });
    projets.value = projetsRes;

    // 2) récupère les Promotions liées via Projet.promo (relation multiple)
    const promoIds = new Set();
    for (const p of projets.value) {
      const rel = p.promo;
      if (Array.isArray(rel)) rel.forEach((id) => promoIds.add(id));
      else if (typeof rel === "string" && rel) promoIds.add(rel);
    }

    if (promoIds.size > 0) {
      const ids = Array.from(promoIds);
      const filter = ids.map((id) => `id="${id}"`).join(" || ");

      const promos = await pb.collection("Promotion").getFullList({
        filter,
        fields: "id,annee,parcours,promo,presentable",
      });

      const map = {};
      for (const pr of promos) map[pr.id] = pr;
      promotionsById.value = map;
    }
  } catch (e) {
    console.error(e);
    error.value = e.message || "Erreur lors du chargement des projets";
  } finally {
    loading.value = false;
  }
});

// On prépare des infos par projet : années + parcours + rawPromo
const projetsEnrichis = computed(() => {
  return projets.value.map((p) => {
    const promoRel = Array.isArray(p.promo) ? p.promo : p.promo ? [p.promo] : [];

    const yearsSet = new Set();
    const tracksSet = new Set();
    const rawPromo = []; // { annee: "1", parcours: "dev" }

    for (const promoId of promoRel) {
      const pr = promotionsById.value[promoId];
      if (!pr) continue;
      const a = pr.annee != null ? String(pr.annee) : "";
      const t = pr.parcours != null ? String(pr.parcours) : "";
      if (a) yearsSet.add(a);
      if (t) tracksSet.add(t);
      rawPromo.push({ annee: a, parcours: t });
    }

    return {
      projet: p,
      years: Array.from(yearsSet).sort(),
      tracks: Array.from(tracksSet),
      rawPromo,
    };
  });
});

// ✅ filtre lié année+parcours (string-safe)
const projetsFiltres = computed(() => {
  const annee = selectedAnnee.value || "";
  const parcours = selectedParcours.value || "";

  if (!annee && !parcours) return projetsEnrichis.value;

  return projetsEnrichis.value.filter((item) =>
    item.rawPromo.some((rp) => {
      const okA = annee ? rp.annee === annee : true;
      const okP = parcours ? rp.parcours === parcours : true;
      return okA && okP;
    })
  );
});
</script>

<template>
  <div class="min-h-screen bg-[#151A24] text-white">
    <AppHeader />

    <div class="max-w-6xl mx-auto px-6 pb-14">
      <p v-if="loading" class="text-white/70 mt-10">Chargement...</p>
      <p v-else-if="error" class="text-red-300 mt-10">{{ error }}</p>

      <template v-else>
        <!-- Titre + intro -->
        <div class="pt-10">
          <h1 class="text-5xl font-extrabold">Galerie</h1>
          <p class="text-white/70 mt-4 max-w-xl">
            Ici sont conservés tous les projets des années précédentes.
          </p>

          <!-- Filtres (pills) -->
          <div class="mt-6 flex flex-wrap items-center gap-4">
            <!-- Année -->
            <div class="relative">
              <select
                v-model="selectedAnnee"
                class="appearance-none bg-[#CFFFBC] text-black font-medium rounded-full px-6 py-2 pr-10 shadow"
              >
                <option value="">Toutes années</option>
                <option value="1">1ère année</option>
                <option value="2">2ème année</option>
                <option value="3">3ème année</option>
              </select>
              <span class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-black/70">⌄</span>
            </div>

            <!-- Collectif (maquette visuelle) -->
            <div class="relative">
              <button
                type="button"
                class="bg-[#CFFFBC] text-black font-medium rounded-full px-6 py-2 pr-10 shadow"
                title="Collectif (maquette)"
              >
                Collectif
              </button>
              <span class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-black/70">⌄</span>
            </div>

            <!-- Parcours -->
            <div class="relative">
              <select
                v-model="selectedParcours"
                class="appearance-none bg-[#CFFFBC] text-black font-medium rounded-full px-6 py-2 pr-10 shadow"
              >
                <option value="">Tous parcours</option>
                <option value="dev">Développement</option>
                <option value="créa">Design</option>
                <option value="com">Communication</option>
              </select>
              <span class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-black/70">⌄</span>
            </div>

            <!-- Favoris (maquette visuelle) -->
            <button
              type="button"
              class="bg-white text-black font-medium rounded-full px-6 py-2 shadow"
              title="Favoris (maquette)"
            >
              Favoris
            </button>

            <!-- Reset -->
            <button
              type="button"
              class="ml-2 text-[#CFFFBC] text-sm hover:underline"
              @click="selectedAnnee = ''; selectedParcours = ''"
            >
              Réinitialiser
            </button>
          </div>
        </div>

        <!-- Grille projets -->
        <div class="mt-10">
          <div v-if="projetsFiltres.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <RouterLink
              v-for="item in projetsFiltres"
              :key="item.projet.id"
              :to="`/projets/${item.projet.id}`"
              class="group relative rounded-3xl overflow-hidden bg-black/40 border border-white/10 shadow-xl"
            >
              <!-- Image -->
              <img
                v-if="projetPhotoUrl(item.projet)"
                :src="projetPhotoUrl(item.projet)"
                alt="Photo projet"
                class="w-full h-64 object-cover opacity-80 group-hover:opacity-95 transition"
              />
              <div
                v-else
                class="w-full h-64 bg-white/5 flex items-center justify-center text-white/40"
              >
                Pas de photo
              </div>

              <!-- Coeur (visuel) -->
              <div class="absolute top-5 right-5">
                <div class="w-11 h-11 rounded-full bg-[#CFFFBC] text-black flex items-center justify-center shadow">
                  ♡
                </div>
              </div>

              <!-- Badges top-left -->
              <div class="absolute top-5 left-5 flex gap-2">
                <span
                  v-if="item.years.length"
                  class="text-xs font-semibold px-3 py-1 rounded-full bg-[#CFFFBC] text-black shadow"
                >
                  {{ anneeLabel(item.years[item.years.length - 1]) }}
                </span>
                <span class="text-xs font-semibold px-3 py-1 rounded-full bg-[#CFFFBC] text-black shadow">
                  Collectif
                </span>
              </div>

              <!-- Overlay bas -->
              <div class="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                <h3 class="text-3xl font-extrabold text-[#CFFFBC] leading-tight">
                  {{ item.projet.titre || "(Sans titre)" }}
                </h3>

                <!-- Parcours -->
                <div class="mt-3 flex flex-wrap gap-2">
                  <span
                    v-for="t in item.tracks"
                    :key="t"
                    class="text-xs px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white/80"
                  >
                    {{ parcoursLabel(t) }}
                  </span>
                </div>

                <!-- ligne membres (placeholder maquette) -->
                <div class="mt-4 text-white/70 text-sm flex items-center gap-2">
                  <span class="text-[#CFFFBC]">👤</span>
                  <span>—</span>
                </div>
              </div>
            </RouterLink>
          </div>

          <p v-else class="text-white/60 mt-6">
            Aucun projet ne correspond à ces filtres.
          </p>
        </div>
      </template>
    </div>
  </div>
</template>
