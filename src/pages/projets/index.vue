<script setup>
import { ref, onMounted } from "vue";
import { pb } from "../../pb"; // <-- adapte si ton pb.js est ailleurs

const projets = ref([]);
const loading = ref(true);
const error = ref(null);

onMounted(async () => {
  try {
    // ⚠️ adapte "Projet" si le nom de ta collection est différent
    projets.value = await pb.collection("Projets").getFullList({
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
    <h2 class="text-3xl font-bold text-gray-900 mb-6">
      Projets
    </h2>

    <!-- Chargement -->
    <p v-if="loading" class="text-gray-500">
      Chargement des projets...
    </p>

    <!-- Erreur -->
    <p v-else-if="error" class="text-red-600 font-medium">
      {{ error }}
    </p>

    <!-- Liste des projets -->
    <div v-else>
      <div
        v-if="projets.length > 0"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <article
          v-for="projet in projets"
          :key="projet.id"
          class="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow duration-150"
        >
          <h3 class="text-xl font-semibold text-gray-800">
            {{ projet.titre || "(Sans titre)" }}
          </h3>

          <p class="text-gray-600 mt-2 line-clamp-3">
            {{ projet.description || "Aucune description fournie." }}
          </p>

          <div class="mt-4 flex items-center justify-between">
            <span class="text-xs text-gray-400">
              ID : {{ projet.id }}
            </span>

            <RouterLink
              :to="`/projets/${projet.id}`"
              class="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Voir plus
            </RouterLink>
          </div>
        </article>
      </div>

      <p
        v-else
        class="text-gray-500 mt-4"
      >
        Aucun projet trouvé dans PocketBase.
      </p>
    </div>
  </main>
</template>
