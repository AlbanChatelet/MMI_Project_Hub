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
    

    <RouterView />
  </div>
</template>
