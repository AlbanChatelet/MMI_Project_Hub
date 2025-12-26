<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { pb } from "../pb";

const user = ref(pb.authStore.model);
const promotion = ref(null);

const groupes = ref([]); // groupes où l'utilisateur est membre (expand projet)
const promotionsById = ref({}); // cache promotions

const loading = ref(true);
const error = ref(null);

// ✅ Filtres
const selectedAnnee = ref(""); // "" | "1" | "2" | "3"
const selectedParcours = ref(""); // "" | "dev" | "créa" | "com"

const parcoursLabel = (parcours) => {
  const map = {
    dev: "Développement",
    "créa": "Design",
    crea: "Design",
    com: "Communication",
  };
  return map[parcours] || parcours;
};

const anneeLabel = (annee) => {
  if (annee === 1) return "Année 1";
  if (annee === 2) return "Année 2";
  if (annee === 3) return "Année 3";
  return `Année ${annee}`;
};

// Si tu changes l'année, on reset le parcours si besoin (optionnel)
// (en vrai ils sont liés via le filtrage, mais ça évite de rester sur un parcours sans résultat)
watch(selectedAnnee, () => {
  // pas obligatoire, mais souvent plus "logique" UX
  // selectedParcours.value = "";
});

onMounted(async () => {
  try {
    if (!pb.authStore.isValid || !pb.authStore.model?.id) {
      throw new Error("Utilisateur non connecté");
    }

    // 1) user
    user.value = await pb.collection("users").getOne(pb.authStore.model.id);

    // 2) promotion user
    if (user.value.promotion) {
      promotion.value = await pb.collection("Promotion").getOne(user.value.promotion);
    }

    // 3) groupes + expand projet
    groupes.value = await pb.collection("Groupe").getFullList({
      filter: `membres ?~ "${user.value.id}"`,
      sort: "created",
      expand: "projet",
    });

    // 4) récupère toutes les ids promo liées aux projets
    const promoIds = new Set();
    for (const g of groupes.value) {
      const p = g?.expand?.projet;
      if (!p) continue;

      const rel = p.promo;
      if (Array.isArray(rel)) rel.forEach((id) => promoIds.add(id));
      else if (typeof rel === "string" && rel) promoIds.add(rel);
    }

    // 5) fetch promotions
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
    error.value = e.message || "Erreur lors du chargement du profil";
  } finally {
    loading.value = false;
  }
});

// Avatar
const avatarUrl = computed(() => {
  if (!user.value?.avatar) return null;
  return pb.files.getUrl(user.value, user.value.avatar);
});

// Texte promo user
const promotionLabel = computed(() => {
  if (!promotion.value) return null;

  const promoRange = promotion.value.promo;
  const annee = promotion.value.annee;
  const parcours = promotion.value.parcours;

  const anneeTxt =
    annee === 1 ? "1ère année" :
    annee === 2 ? "2ème année" :
    annee === 3 ? "3ème année" :
    `${annee}ème année`;

  const parcoursTxt = parcoursLabel(parcours);

  if (promoRange) return `${promoRange} • ${anneeTxt} - ${parcoursTxt}`;
  return `${anneeTxt} - ${parcoursTxt}`;
});

// URL photo projet (champ "photo")
const projetPhotoUrl = (projet) => {
  if (!projet?.photo) return null;
  return pb.files.getUrl(projet, projet.photo);
};

/**
 * Construit la liste de projets (dédupliqués) avec :
 * - projet
 * - annees (["Année 1", ...])
 * - parcours (["Développement", "Design", ...])
 * - rawPromo (pour filtrer facilement : [{annee, parcours}, ...])
 */
const projetsDuUser = computed(() => {
  const map = new Map();

  for (const g of groupes.value) {
    const p = g?.expand?.projet;
    if (!p?.id) continue;

    const promoRel = Array.isArray(p.promo) ? p.promo : p.promo ? [p.promo] : [];

    const anneesSet = new Set();
    const parcoursSet = new Set();
    const rawPromo = []; // [{annee, parcours}]

    for (const promoId of promoRel) {
      const promoRecord = promotionsById.value[promoId];
      if (!promoRecord) continue;

      if (promoRecord.annee) {
        anneesSet.add(anneeLabel(promoRecord.annee));
      }
      if (promoRecord.parcours) {
        parcoursSet.add(parcoursLabel(promoRecord.parcours));
      }

      rawPromo.push({
        annee: promoRecord.annee,
        parcours: promoRecord.parcours,
      });
    }

    const payload = {
      projet: p,
      annees: Array.from(anneesSet).sort(),
      parcours: Array.from(parcoursSet),
      rawPromo,
    };

    if (!map.has(p.id)) map.set(p.id, payload);
    else {
      const existing = map.get(p.id);

      existing.annees = Array.from(new Set([...existing.annees, ...payload.annees])).sort();
      existing.parcours = Array.from(new Set([...existing.parcours, ...payload.parcours]));

      // merge rawPromo
      existing.rawPromo = [...existing.rawPromo, ...payload.rawPromo];

      map.set(p.id, existing);
    }
  }

  return Array.from(map.values());
});

// ✅ Liste filtrée selon année + parcours (liés)
const projetsFiltres = computed(() => {
  const annee = selectedAnnee.value || "";       // "1" | "2" | "3" | ""
  const parcours = selectedParcours.value || ""; // "dev" | "créa" | "com" | ""

  // Pas de filtre -> tout
  if (!annee && !parcours) return projetsDuUser.value;

  return projetsDuUser.value.filter((item) => {
    return item.rawPromo.some((rp) => {
      const rpAnnee = rp.annee != null ? String(rp.annee) : "";
      const rpParcours = rp.parcours != null ? String(rp.parcours) : "";

      const okAnnee = annee ? rpAnnee === annee : true;
      const okParcours = parcours ? rpParcours === parcours : true;

      return okAnnee && okParcours;
    });
  });
});

</script>

<template>
  <main class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="bg-white p-8 rounded-xl shadow-md text-center w-[36rem]">
      <h1 class="text-3xl font-bold mb-6">Dashboard Élève</h1>

      <p v-if="loading" class="text-gray-500">Chargement...</p>
      <p v-else-if="error" class="text-red-500">{{ error }}</p>

      <template v-else>
        <!-- Avatar -->
        <div class="flex justify-center mb-4">
          <img
            v-if="avatarUrl"
            :src="avatarUrl"
            alt="Avatar"
            class="w-24 h-24 rounded-full object-cover border"
          />
          <div
            v-else
            class="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center text-3xl font-bold text-gray-600"
          >
            {{ user?.name?.charAt(0).toUpperCase() || "?" }}
          </div>
        </div>

        <!-- Nom -->
        <p class="text-lg text-gray-700">
          Bonjour <span class="font-semibold">{{ user.name }}</span> 👋
        </p>

        <!-- Promotion -->
        <p v-if="promotionLabel" class="text-sm text-gray-500 mt-2">
          {{ promotionLabel }}
        </p>
        <p v-else class="text-sm text-gray-400 mt-2">
          Promotion non renseignée
        </p>

        <!-- ✅ FILTRES -->
        <div class="mt-6 text-left border rounded-lg p-3 bg-gray-50">
          <p class="text-sm font-medium text-gray-700 mb-2">Filtrer les projets :</p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <!-- Filtre année -->
            <div>
              <label class="block text-xs text-gray-600 mb-1">Année</label>
              <select
                v-model="selectedAnnee"
                class="w-full border rounded-md px-2 py-2 text-sm bg-white"
              >
                <option value="">Toutes</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
            </div>

            <!-- Filtre parcours -->
            <div>
              <label class="block text-xs text-gray-600 mb-1">Parcours</label>
              <select
                v-model="selectedParcours"
                class="w-full border rounded-md px-2 py-2 text-sm bg-white"
              >
                <option value="">Tous</option>
                <option value="dev">Développement</option>
                <option value="créa">Design</option>
                <option value="com">Communication</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            class="mt-3 text-xs text-blue-600 hover:underline"
            @click="selectedAnnee = ''; selectedParcours = ''"
          >
            Réinitialiser les filtres
          </button>
        </div>

        <!-- ✅ Projets filtrés -->
        <div class="mt-5 text-left">
          <p class="text-sm font-medium text-gray-700 mb-2">
            Mes projets <span class="text-gray-400">({{ projetsFiltres.length }})</span> :
          </p>

          <div v-if="projetsFiltres.length" class="space-y-3">
            <div
              v-for="item in projetsFiltres"
              :key="item.projet.id"
              class="flex gap-3 items-start border rounded-lg p-3"
            >
              <!-- Photo -->
              <img
                v-if="projetPhotoUrl(item.projet)"
                :src="projetPhotoUrl(item.projet)"
                alt="Photo projet"
                class="w-20 h-20 rounded-md object-cover border"
              />
              <div
                v-else
                class="w-20 h-20 rounded-md bg-gray-100 border flex items-center justify-center text-xs text-gray-400"
              >
                Pas de photo
              </div>

              <div class="flex-1">
                <div class="flex items-start gap-2">
                  <p class="font-semibold text-gray-900">
                    {{ item.projet.titre || "(Sans titre)" }}
                  </p>

                  <RouterLink
                    :to="`/projets/${item.projet.id}`"
                    class="ml-auto text-xs text-blue-600 hover:underline"
                  >
                    Voir
                  </RouterLink>
                </div>

                <!-- Badges années -->
                <div class="mt-1 flex flex-wrap gap-2">
                  <span
                    v-for="a in item.annees"
                    :key="a"
                    class="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-700 border"
                  >
                    {{ a }}
                  </span>

                  <!-- Badges parcours -->
                  <span
                    v-for="p in item.parcours"
                    :key="p"
                    class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border"
                  >
                    {{ p }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <p v-else class="text-sm text-gray-400">
            Aucun projet ne correspond à ces filtres.
          </p>
        </div>
      </template>
    </div>
  </main>
</template>
