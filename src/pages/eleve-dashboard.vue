<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ref, onMounted, computed } from "vue";
import { pb } from "../pb";

const user = ref(pb.authStore.model);
const promotion = ref(null);

const loading = ref(true);
const error = ref(null);

onMounted(async () => {
  try {
    if (!pb.authStore.isValid || !pb.authStore.model?.id) {
      throw new Error("Utilisateur non connecté");
    }

    // 1) Recharge le user (au cas où authStore.model est incomplet)
    user.value = await pb.collection("users").getOne(pb.authStore.model.id);

    // 2) Si le user a une promotion (id), on récupère l'enregistrement Promotion
    if (user.value.promotion) {
      promotion.value = await pb.collection("Promotion").getOne(user.value.promotion);
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

// Texte “3ème année - Développement”
const promotionLabel = computed(() => {
  if (!promotion.value) return null;

  const annee = promotion.value.annee;       // 1 / 2 / 3
  const parcours = promotion.value.parcours; // dev / créa / com

  const anneeLabel =
    annee === 1 ? "1ère année" :
    annee === 2 ? "2ème année" :
    annee === 3 ? "3ème année" :
    `${annee}ème année`;

  const parcoursMap = {
    dev: "Développement",
    "créa": "Création",
    crea: "Création",
    com: "Communication",
  };

  const parcoursLabel = parcoursMap[parcours] || parcours;

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
      </template>
    </div>
  </main>
</template>
