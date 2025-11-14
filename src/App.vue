<script setup>
import { ref, onMounted } from "vue";
import { pb } from "./pb";

const projets = ref([]);
const loading = ref(true);
const error = ref(null);

onMounted(async () => {
  try {
    projets.value = await pb.collection("Projet").getFullList({
      sort: "-created",
    });
  } catch (err) {
    console.error(err);
    error.value = err.message || "Erreur lors du chargement des projets";
  } finally {
    loading.value = false;
  }
});
</script>


<template>
  <main class="max-w-5xl mx-auto py-12 px-6">

    <h1 class="text-4xl font-bold text-gray-900 mb-10">
      MMI Project Hub – Projets
    </h1>

    <!-- Chargement -->
    <p v-if="loading" class="text-gray-500 text-lg">
      Chargement des projets...
    </p>

    <!-- Erreur -->
    <p v-else-if="error" class="text-red-600 text-lg font-medium">
      {{ error }}
    </p>

    <!-- Liste des projets -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="projet in projets"
        :key="projet.id"
        class="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow duration-200"
      >
        <h2 class="text-xl font-semibold text-gray-800">
          {{ projet.titre || "(Sans titre)" }}
        </h2>

        <p class="text-gray-600 mt-2 line-clamp-3">
          {{ projet.description }}
        </p>

        <div class="mt-4 flex justify-between items-center">
          <span class="text-sm text-gray-400">ID : {{ projet.id }}</span>

          <button
            class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            Voir plus
          </button>
        </div>
      </div>
    </div>

    <!-- Aucun projet -->
    <p
      v-if="!loading && !error && projets.length === 0"
      class="text-gray-500 mt-10 text-lg"
    >
      Aucun projet trouvé dans PocketBase.
    </p>
  </main>
</template>
