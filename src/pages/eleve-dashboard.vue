<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import AppHeader from '@/components/AppHeader.vue'
import { ref, onMounted, computed } from "vue";
import { pb } from "../pb";

const user = ref(pb.authStore.model);
const promotion = ref(null);

const groupes = ref([]); // groupes où l'utilisateur est membre (expand projet)
const promotionsById = ref({}); // cache promotions (id -> promotion)

const loading = ref(true);
const error = ref(null);

// Filtres (liés)
const selectedAnnee = ref("");     // "" | "1" | "2" | "3"
const selectedParcours = ref("");  // "" | "dev" | "créa" | "com"

// Labels
const parcoursLabel = (parcours) => {
  const map = { dev: "Développement", "créa": "Design", crea: "Design", com: "Communication" };
  return map[parcours] || parcours;
};
const anneeLabelText = (annee) => {
  const a = String(annee);
  if (a === "1") return "1ère année";
  if (a === "2") return "2ème année";
  if (a === "3") return "3ème année";
  return `${a}ème année`;
};

// URL image projet (champ "photo")
const projetPhotoUrl = (projet) => {
  if (!projet?.photo) return null;
  return pb.files.getUrl(projet, projet.photo);
};

// Avatar user
const avatarUrl = computed(() => {
  if (!user.value?.avatar) return null;
  return pb.files.getUrl(user.value, user.value.avatar);
});

// Texte promo user
const promotionLabel = computed(() => {
  if (!promotion.value) return null;
  const promoRange = promotion.value.promo;     // ex "2023-2026"
  const annee = promotion.value.annee;          // "1"/"2"/"3" ou 1/2/3
  const parcours = promotion.value.parcours;    // dev/créa/com
  const line = `${anneeLabelText(annee)} - ${parcoursLabel(parcours)}`;
  return promoRange ? `${promoRange} • ${line}` : line;
});

onMounted(async () => {
  try {
    if (!pb.authStore.isValid || !pb.authStore.model?.id) {
      throw new Error("Utilisateur non connecté");
    }

    // 1) Recharge user
    user.value = await pb.collection("users").getOne(pb.authStore.model.id);

    // 2) Promo user (par ID)
    if (user.value.promotion) {
      promotion.value = await pb.collection("Promotion").getOne(user.value.promotion);
    }

    // 3) Groupes + expand projet
    groupes.value = await pb.collection("Groupe").getFullList({
      filter: `membres ?~ "${user.value.id}"`,
      expand: "projet",
      sort: "created",
    });

    // 4) Collecte ids de promotions liées aux projets (Projet.promo)
    const promoIds = new Set();
    for (const g of groupes.value) {
      const p = g?.expand?.projet;
      if (!p) continue;

      const rel = p.promo;
      if (Array.isArray(rel)) rel.forEach((id) => promoIds.add(id));
      else if (typeof rel === "string" && rel) promoIds.add(rel);
    }

    // 5) Fetch promotions concernées
    if (promoIds.size > 0) {
      const ids = Array.from(promoIds);
      const filter = ids.map((id) => `id="${id}"`).join(" || ");

      const promos = await pb.collection("Promotion").getFullList({
        filter,
        fields: "id,parcours,annee,promo,presentable",
      });

      const map = {};
      for (const pr of promos) map[pr.id] = pr;
      promotionsById.value = map;
    }
  } catch (e) {
    console.error(e);
    error.value = e.message || "Erreur lors du chargement";
  } finally {
    loading.value = false;
  }
});

/**
 * Projets dédupliqués + infos badges dérivées de Projet.promo -> Promotion(annee, parcours)
 */
const projetsDuUser = computed(() => {
  const map = new Map(); // projetId -> { projet, years[], tracks[], rawPromo[] }

  for (const g of groupes.value) {
    const p = g?.expand?.projet;
    if (!p?.id) continue;

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

    const payload = {
      projet: p,
      years: Array.from(yearsSet).sort(),     // ["1","3"]
      tracks: Array.from(tracksSet),          // ["dev","créa"]
      rawPromo,
    };

    if (!map.has(p.id)) map.set(p.id, payload);
    else {
      const ex = map.get(p.id);
      ex.years = Array.from(new Set([...ex.years, ...payload.years])).sort();
      ex.tracks = Array.from(new Set([...ex.tracks, ...payload.tracks]));
      ex.rawPromo = [...ex.rawPromo, ...payload.rawPromo];
      map.set(p.id, ex);
    }
  }

  return Array.from(map.values());
});

// ✅ filtres liés année+parcours (string-safe)
const projetsFiltres = computed(() => {
  const annee = selectedAnnee.value || "";
  const parcours = selectedParcours.value || "";

  if (!annee && !parcours) return projetsDuUser.value;

  return projetsDuUser.value.filter((item) =>
    item.rawPromo.some((rp) => {
      const okA = annee ? rp.annee === annee : true;
      const okP = parcours ? rp.parcours === parcours : true;
      return okA && okP;
    })
  );
});

// Helpers d’affichage badges
const yearBadge = (y) => anneeLabelText(y);
const trackBadge = (t) => parcoursLabel(t);

// Pseudo : on prend name, sinon username
const displayName = computed(() => user.value?.name || user.value?.username || "Utilisateur");
</script>

<template>
  
    <AppHeader />
  <div class="min-h-screen bg-[#151A24] text-white">
    <!-- Container -->
    <div class="max-w-6xl mx-auto px-6 py-10">
      <p v-if="loading" class="text-white/70">Chargement...</p>
      <p v-else-if="error" class="text-red-300">{{ error }}</p>

      <template v-else>
        <!-- HEADER PROFIL -->
        <div class="flex items-center gap-6">
          <div class="relative">
            <img
              v-if="avatarUrl"
              :src="avatarUrl"
              alt="Avatar"
              class="w-24 h-24 rounded-full object-cover border border-white/10"
            />
            <div
              v-else
              class="w-24 h-24 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-3xl font-bold"
            >
              {{ displayName.charAt(0).toUpperCase() }}
            </div>

            <!-- petit bouton edit (pure déco comme maquette) -->
            <button
              class="absolute -top-1 -left-1 w-9 h-9 rounded-full bg-[#CFFFBC] text-black flex items-center justify-center shadow"
              type="button"
              title="Modifier"
            >
              ✎
            </button>
          </div>

          <div class="flex-1">
            <h1 class="text-4xl font-extrabold tracking-tight text-white/80">
              {{ displayName }}
            </h1>
            <p class="text-white/60 mt-1">
              {{ promotionLabel || "Promotion non renseignée" }}
            </p>
          </div>
        </div>

        <!-- TITRE -->
        <div class="mt-14">
          <h2 class="text-5xl font-extrabold">Mes projets</h2>

          <!-- FILTRES (pills) -->
          <div class="mt-6 flex flex-wrap items-center gap-4">
            <!-- Année -->
            <div class="relative">
              <select
                v-model="selectedAnnee"
                class="appearance-none bg-[#CFFFBC] text-black font-medium rounded-full px-5 py-2 pr-10 shadow"
              >
                <option value="">Toutes années</option>
                <option value="1">1ère année</option>
                <option value="2">2ème année</option>
                <option value="3">3ème année</option>
              </select>
              <span class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-black/70">⌄</span>
            </div>

            <!-- Collectif (visuel) -->
            <div class="relative">
              <button
                type="button"
                class="bg-[#CFFFBC] text-black font-medium rounded-full px-5 py-2 pr-10 shadow"
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
                class="appearance-none bg-[#CFFFBC] text-black font-medium rounded-full px-5 py-2 pr-10 shadow"
              >
                <option value="">Tous parcours</option>
                <option value="dev">Développement</option>
                <option value="créa">Design</option>
                <option value="com">Communication</option>
              </select>
              <span class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-black/70">⌄</span>
            </div>

            <!-- Favoris (visuel) -->
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

          <!-- GRILLE PROJETS -->
          <div class="mt-8">
            <div v-if="projetsFiltres.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  class="w-full h-56 object-cover opacity-80 group-hover:opacity-95 transition"
                />
                <div
                  v-else
                  class="w-full h-56 bg-white/5 flex items-center justify-center text-white/40"
                >
                  Pas de photo
                </div>

                <!-- Coeur (visuel) -->
                <div class="absolute top-4 right-4">
                  <div class="w-10 h-10 rounded-full bg-[#CFFFBC] text-black flex items-center justify-center shadow">
                    ♡
                  </div>
                </div>

                <!-- Badges top-left (année + "Collectif" comme maquette) -->
                <div class="absolute top-4 left-4 flex gap-2">
                  <span
                    v-if="item.years.length"
                    class="text-xs font-semibold px-3 py-1 rounded-full bg-[#CFFFBC] text-black shadow"
                  >
                    {{ yearBadge(item.years[item.years.length - 1]) }}
                  </span>
                  <span class="text-xs font-semibold px-3 py-1 rounded-full bg-[#CFFFBC] text-black shadow">
                    Collectif
                  </span>
                </div>

                <!-- Overlay bas -->
                <div class="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                  <h3 class="text-3xl font-extrabold text-[#CFFFBC] leading-tight">
                    {{ item.projet.titre || "(Sans titre)" }}
                  </h3>

                  <!-- Parcours (badges) -->
                  <div class="mt-2 flex flex-wrap gap-2">
                    <span
                      v-for="t in item.tracks"
                      :key="t"
                      class="text-xs px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white/80"
                    >
                      {{ trackBadge(t) }}
                    </span>
                  </div>

                  <!-- (option) ligne membres : pour l’instant juste visuel -->
                  <div class="mt-3 text-white/70 text-sm flex items-center gap-2">
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
        </div>
      </template>
    </div>
  </div>
</template>
