<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ref, onMounted, computed } from "vue";
import { pb } from "../pb";

const user = ref(pb.authStore.model);
const promotion = ref(null);

// Groupes où l'utilisateur est membre (avec expand projet)
const groupes = ref([]);

// Cache des promotions (id -> record Promotion)
const promotionsById = ref({});

const loading = ref(true);
const error = ref(null);

const parcoursLabel = (parcours) => {
  const map = {
    dev: "Développement",
    "créa": "Design",
    crea: "Design",
    com: "Communication",
  };
  return map[parcours] || parcours;
};

onMounted(async () => {
  try {
    if (!pb.authStore.isValid || !pb.authStore.model?.id) {
      throw new Error("Utilisateur non connecté");
    }

    // 1) Recharge le user
    user.value = await pb.collection("users").getOne(pb.authStore.model.id);

    // 2) Promotion du user (par ID)
    if (user.value.promotion) {
      promotion.value = await pb.collection("Promotion").getOne(user.value.promotion);
    }

    // 3) Groupes du user + projet expand
    groupes.value = await pb.collection("Groupe").getFullList({
      filter: `membres ?~ "${user.value.id}"`,
      sort: "created",
      expand: "projet",
    });

    // 4) Récupère toutes les ids de promotions liées aux projets (Projet.promo)
    const promoIds = new Set();
    for (const g of groupes.value) {
      const p = g?.expand?.projet;
      if (!p) continue;

      // Projet.promo = relation multiple -> tableau d'ids
      const rel = p.promo;
      if (Array.isArray(rel)) rel.forEach((id) => promoIds.add(id));
      else if (typeof rel === "string" && rel) promoIds.add(rel);
    }

    // 5) Fetch en une fois des promotions concernées (si il y en a)
    if (promoIds.size > 0) {
      const ids = Array.from(promoIds);

      // construit un filter : id="..." OR id="..." ...
      const filter = ids.map((id) => `id="${id}"`).join(" || ");

      const promos = await pb.collection("Promotion").getFullList({
        filter,
        fields: "id,parcours,annee,promo,presentable",
      });

      // met en cache
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

// Texte promo : "2023-2026 • 3ème année - Développement"
const promotionLabel = computed(() => {
  if (!promotion.value) return null;

  const promoRange = promotion.value.promo; // ex: "2023-2026"
  const annee = promotion.value.annee; // 1 / 2 / 3
  const parcours = promotion.value.parcours; // dev / créa / com

  const anneeLabel =
    annee === 1
      ? "1ère année"
      : annee === 2
      ? "2ème année"
      : annee === 3
      ? "3ème année"
      : `${annee}ème année`;

  const parcoursTxt = parcoursLabel(parcours);

  if (promoRange) return `${promoRange} • ${anneeLabel} - ${parcoursTxt}`;
  return `${anneeLabel} - ${parcoursTxt}`;
});

// ✅ Projets dédupliqués + leurs parcours (badges)
const projetsDuUser = computed(() => {
  const map = new Map(); // id -> { projet, parcoursLabels[] }

  for (const g of groupes.value) {
    const p = g?.expand?.projet;
    if (!p?.id) continue;

    // calcule les parcours depuis Projet.promo (ids Promotion)
    const promoRel = Array.isArray(p.promo) ? p.promo : p.promo ? [p.promo] : [];
    const parcoursSet = new Set();

    for (const promoId of promoRel) {
      const promoRecord = promotionsById.value[promoId];
      if (promoRecord?.parcours) parcoursSet.add(parcoursLabel(promoRecord.parcours));
    }

    const payload = {
      projet: p,
      parcours: Array.from(parcoursSet),
    };

    // dédupe (si plusieurs groupes pointent vers le même projet)
    if (!map.has(p.id)) map.set(p.id, payload);
    else {
      // merge parcours si déjà présent
      const existing = map.get(p.id);
      for (const lab of payload.parcours) existing.parcours.push(lab);
      existing.parcours = Array.from(new Set(existing.parcours));
      map.set(p.id, existing);
    }
  }

  return Array.from(map.values());
});
</script>

<template>
  <main class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="bg-white p-8 rounded-xl shadow-md text-center w-[28rem]">
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

        <!-- ✅ Projets + badges parcours -->
        <div class="mt-5 text-left">
          <p class="text-sm font-medium text-gray-700 mb-2">Mes projets :</p>

          <ul v-if="projetsDuUser.length" class="space-y-2">
            <li
              v-for="item in projetsDuUser"
              :key="item.projet.id"
              class="flex items-center gap-2"
            >
              <span class="font-medium text-gray-800">
                {{ item.projet.titre || "(Sans titre)" }}
              </span>

              <!-- Badges parcours -->
              <div class="flex gap-2 flex-wrap">
                <span
                  v-for="par in item.parcours"
                  :key="par"
                  class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border"
                >
                  {{ par }}
                </span>
              </div>

              <RouterLink
                :to="`/projets/${item.projet.id}`"
                class="ml-auto text-xs text-blue-600 hover:underline"
              >
                Voir
              </RouterLink>
            </li>
          </ul>

          <p v-else class="text-sm text-gray-400">
            Aucun projet lié à tes groupes
          </p>
        </div>
      </template>
    </div>
  </main>
</template>
