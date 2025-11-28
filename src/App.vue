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
  <div class="min-h-screen bg-gray-50">
    <header class="border-b bg-white">
      <div class="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <h1 class="text-xl font-semibold text-gray-900">
          MMI Project Hub
        </h1>

        <nav class="space-x-4 text-sm">
          <RouterLink to="/" class="text-gray-600 hover:text-gray-900">
            Accueil
          </RouterLink>
          <RouterLink to="/login" class="text-gray-600 hover:text-gray-900">
            Login
          </RouterLink>
        </nav>
      </div>
    </header>

    <RouterView />
  </div>
</template>
