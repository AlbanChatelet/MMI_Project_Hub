<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { computed } from "vue";
import { pb } from "../pb";

// Utilisateur connecté
const user = computed(() => pb.authStore.model);
</script>

<template>
  <main class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="bg-white p-8 rounded-xl shadow-md text-center">
      <h1 class="text-3xl font-bold mb-4">
        Dashboard Élève
      </h1>

      <!-- Nom de l'utilisateur -->
      <p v-if="user" class="text-lg text-gray-700">
        Bonjour <span class="font-semibold">{{ user.name }}</span> 👋
      </p>

      <!-- Sécurité : si pas connecté -->
      <p v-else class="text-red-500">
        Aucun utilisateur connecté.
      </p>
    </div>
  </main>
</template>
