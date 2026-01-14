<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ref, onMounted, computed } from "vue";
import { pb } from "../pb";
import AppHeader from "@/components/AppHeader.vue";

const projets = ref([]);
const groupes = ref([]); // ✅ pour retrouver le groupe + membres
const promotionsById = ref({}); // cache Promotions utilisées par les projets
const loading = ref(true);
const error = ref(null);

// Filtres
const selectedAnnee = ref("");     // "" | "1" | "2" | "3"
const selectedParcours = ref("");  // "" | "dev" | "créa" | "com"
const selectedType = ref("");      // "" | "solo" | "collectif"

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
  return pb.files.getURL(projet, projet.photo);
};

// ✅ helpers membres
const userDisplayName = (u) => {
  const prenom = String(u?.prenom || "").trim();
  const nom = String(u?.nom || "").trim();
  const full = `${prenom} ${nom}`.trim();
  return full || u?.name || u?.username || u?.email || "Utilisateur";
};

// Trouve le groupe associé à un projet (dans ta DB tu utilises Groupe.projet)
const getGroupeByProjetId = (projetId) => {
  return groupes.value.find(
    (g) =>
      g.projet === projetId ||
      (Array.isArray(g.projet) && g.projet.includes(projetId))
  );
};

const getGroupeMembres = (projetId) => {
  const g = getGroupeByProjetId(projetId);
  const membres = g?.expand?.membres;
  return Array.isArray(membres) ? membres : [];
};

const formatMembres = (projetId) => {
  const membres = getGroupeMembres(projetId);
  if (!membres.length) return "—";
  return membres.map((m) => userDisplayName(m)).join(", ");
};

onMounted(async () => {
  try {
    // 1) récupère tous les projets
    const projetsRes = await pb.collection("Projet").getFullList({
      sort: "-created",
      expand: "sujet", // ✅ pour type_sujet (solo/collectif) si c’est dans sujet
    });
    projets.value = projetsRes;

    // 2) récupère tous les groupes + membres (pour afficher les membres)
    groupes.value = await pb.collection("Groupe").getFullList({
      expand: "membres",
      sort: "created",
    });

    // 3) récupère les Promotions liées via Projet.promo (relation multiple)
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

// On prépare des infos par projet : années + parcours + rawPromo + type_sujet
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

    // ✅ type (solo/collectif) depuis le sujet (priorité) sinon depuis le projet
    const typeSujet =
      String(p?.expand?.sujet?.type_sujet || p?.type_sujet || p?.type || "")
        .trim()
        .toLowerCase();

    return {
      projet: p,
      years: Array.from(yearsSet).sort(),
      tracks: Array.from(tracksSet),
      rawPromo,
      typeSujet, // ✅ pour filtre Solo/Collectif
    };
  });
});

// ✅ filtre lié année+parcours + filtre solo/collectif
const projetsFiltres = computed(() => {
  const annee = selectedAnnee.value || "";
  const parcours = selectedParcours.value || "";
  const type = selectedType.value || "";

  return projetsEnrichis.value.filter((item) => {
    // filtre annee/parcours
    const okPromo =
      !annee && !parcours
        ? true
        : item.rawPromo.some((rp) => {
            const okA = annee ? rp.annee === annee : true;
            const okP = parcours ? rp.parcours === parcours : true;
            return okA && okP;
          });

    // filtre solo/collectif
    const okType = type ? item.typeSujet === type : true;

    return okPromo && okType;
  });
});

// reset
const resetFilters = () => {
  selectedAnnee.value = "";
  selectedParcours.value = "";
  selectedType.value = "";
};
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

            <!-- ✅ Solo / Collectif (fonctionnel) -->
            <div class="relative">
              <select
                v-model="selectedType"
                class="appearance-none bg-[#CFFFBC] text-black font-medium rounded-full px-6 py-2 pr-10 shadow"
              >
                <option value="">Solo + Collectif</option>
                <option value="solo">Solo</option>
                <option value="collectif">Collectif</option>
              </select>
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

            <!-- ✅ Reset -->
            <button
              type="button"
              class="ml-2 text-[#CFFFBC] text-sm hover:underline"
              @click="resetFilters"
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

              

              <!-- Badges top-left -->
              <div class="absolute top-5 left-5 flex gap-2">
                <span
                  v-if="item.years.length"
                  class="text-xs font-semibold px-3 py-1 rounded-full bg-[#CFFFBC] text-black shadow"
                >
                  {{ anneeLabel(item.years[item.years.length - 1]) }}
                </span>

                <!-- ✅ Badge Solo/Collectif (réel) -->
                <span
                  class="text-xs font-semibold px-3 py-1 rounded-full bg-[#CFFFBC] text-black shadow"
                >
                  {{ item.typeSujet === "solo" ? "Solo" : item.typeSujet === "collectif" ? "Collectif" : "—" }}
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

                <!-- ✅ Membres du groupe (réel) -->
                <div class="mt-4 text-white/70 text-sm flex items-center gap-2">
                  <span class="text-[#CFFFBC]">👤</span>
                  <span class="line-clamp-1">
                    {{ formatMembres(item.projet.id) }}
                  </span>
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
