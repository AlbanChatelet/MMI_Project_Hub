<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { pb } from "./pb";
import AppFooter from "@/components/AppFooter.vue";

const route = useRoute();

const projets = ref([]);
const loading = ref(true);
const error = ref(null);

// Routes sur lesquelles le footer NE doit PAS s'afficher
const hiddenFooterRoutes = ["/", "/login", "/register"];

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
  <div class="min-h-screen bg-[#151A24] flex flex-col">
    <!-- Contenu principal -->
    <div class="flex-1">
      <RouterView />
    </div>

    <!-- Footer (conditionnel) -->
    <AppFooter v-if="!hiddenFooterRoutes.includes(route.path)" />
  </div>
</template>
