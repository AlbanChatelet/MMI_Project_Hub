<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="flex justify-center space-x-4 p-8 bg-gray-900">
    <div
      v-for="(year, index) in years"
      :key="index"
      class="relative flex items-center"
    >
      <div
        class="w-48 h-32 bg-[#CCFFBC] p-4 flex items-center justify-center text-xl font-bold text-gray-900 shadow-lg transition duration-300 hover:shadow-2xl rounded-md relative"
      >
        {{ year }}

        <div class="absolute bottom-2 right-2 text-xl text-gray-900">
          ↗
        </div>
      </div>

      </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// Définition des données pour les blocs
const years = ref([
  '1ère année',
  '2ème année',
  '3ème année',
]);
</script>

<style scoped>
/* Suppression de la logique CSS ::after car elle n'est plus nécessaire */
/* .relative::after, .relative:last-child::after { content: none; } */
</style>
