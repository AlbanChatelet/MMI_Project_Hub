<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { pb } from "../../pb"; // très important : adapter le chemin !

const route = useRoute();
const projetId = route.params.id;

const projet = ref(null);
const etapes = ref([]);
const loading = ref(true);
const error = ref(null);

onMounted(async () => {
  try {
    // 1) Récupérer le projet
    projet.value = await pb.collection("Projets").getOne(projetId);

    // 2) TEST : récupérer toutes les étapes sans filtre
    etapes.value = await pb.collection("Etapes").getFullList();
    // (juste pour voir si ça plante encore ou pas)

  } catch (err) {
    console.error(err);
    error.value = err.message || "Erreur lors du chargement du projet";
  } finally {
    loading.value = false;
  }
});

</script>

<template>
  <main class="max-w-4xl mx-auto py-10 px-6">

    <!-- Loading -->
    <p v-if="loading" class="text-gray-500">Chargement...</p>

    <!-- Error -->
    <p v-else-if="error" class="text-red-600">{{ error }}</p>

    <div v-else>

      <h1 class="text-3xl font-bold text-gray-900 mb-4">
        {{ projet?.titre }}
      </h1>

      <p class="text-gray-600 mb-6">
        {{ projet?.description }}
      </p>

      <h2 class="text-2xl font-semibold mb-3">Étapes du projet</h2>

      <p v-if="etapes.length === 0" class="text-gray-500">
        Aucune étape définie.
      </p>

      <ul v-else class="space-y-4">
        <li
          v-for="etape in etapes"
          :key="etape.id"
          class="bg-white rounded-xl shadow-sm border border-gray-200 p-5"
        >
          <h3 class="text-lg font-semibold text-gray-800">
            {{ etape.titre }}
          </h3>

          <p class="text-gray-600 mt-1">
            {{ etape.description }}
          </p>

          <div class="text-sm text-gray-500 mt-3 flex gap-4">
            <span v-if="etape.date_debut">
              Début :
              {{ new Date(etape.date_debut).toLocaleDateString() }}
            </span>
            <span v-if="etape.date_fin">
              Fin :
              {{ new Date(etape.date_fin).toLocaleDateString() }}
            </span>
          </div>
        </li>
      </ul>
    </div>
  </main>
</template>
