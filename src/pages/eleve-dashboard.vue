<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ref, onMounted, computed } from "vue";
import { pb } from "../pb";

const user = ref(pb.authStore.model);
const promotion = ref(null);
const groupes = ref([]); // ✅ plusieurs groupes

const loading = ref(true);
const error = ref(null);

onMounted(async () => {
  try {
    if (!pb.authStore.isValid || !pb.authStore.model?.id) {
      throw new Error("Utilisateur non connecté");
    }

    // 1) Recharge le user (authStore.model peut être incomplet)
    user.value = await pb.collection("users").getOne(pb.authStore.model.id);

    // 2) Promotion (par ID)
    if (user.value.promotion) {
      promotion.value = await pb
        .collection("Promotion")
        .getOne(user.value.promotion);
    }

    // 3) ✅ Récupère TOUS les groupes où l'utilisateur est membre
    groupes.value = await pb.collection("Groupe").getFullList({
      filter: `membres ?~ "${user.value.id}"`,
      sort: "nom",
    });
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

  const parcoursMap = {
    dev: "Développement",
    "créa": "Création",
    crea: "Création",
    com: "Communication",
  };

  const parcoursLabel = parcoursMap[parcours] || parcours;

  if (promoRange) return `${promoRange} • ${anneeLabel} - ${parcoursLabel}`;
  return `${anneeLabel} - ${parcoursLabel}`;
});
</script>

<template>
  <main class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="bg-white p-8 rounded-xl shadow-md text-center w-96">
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

        <!-- ✅ Groupes (liste) -->
        <div class="mt-3 text-left">
          <p class="text-sm font-medium text-gray-700 mb-1">Groupes :</p>

          <ul v-if="groupes.length" class="text-sm text-gray-600 space-y-1">
            <li v-for="g in groupes" :key="g.id" class="flex items-center gap-2">
              <span class="text-gray-400">•</span>
              <span class="font-medium">{{ g.nom }}</span>
            </li>
          </ul>

          <p v-else class="text-sm text-gray-400">
            Groupe non renseigné
          </p>
        </div>
      </template>
    </div>
  </main>
</template>
