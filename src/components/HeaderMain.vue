<template>
  <!-- Header flottant, centré -->
  <header
    class="fixed top-6 left-1/2 z-50 w-full -translate-x-1/2 px-4"
  >
    <div
      class="mx-auto flex max-w-5xl items-center justify-between rounded-full bg-[#191F2B] px-4 py-3 shadow-xl lg:px-8 lg:py-4"
    >
      <!-- Logo -->
      <div class="flex items-center">
        <MyLogo class="w-24 h-auto md:w-32" />
      </div>

      <!-- Nav centrale -->
      <nav class="hidden gap-10 text-sm font-medium text-[#CCFFBC] md:flex">
        <RouterLink
          to="/galerie"
          class="transition-colors hover:text-white"
        >
          Galerie
        </RouterLink>
        <RouterLink
          to="/projets-a-la-une"
          class="transition-colors hover:text-white"
        >
          Projets à la une
        </RouterLink>
      </nav>

      <!-- Bouton "Mon espace" -->
      <RouterLink
        to="/mon-espace"
        class="ml-4 flex items-center gap-2 rounded-full bg-[#CCFFBC] px-5 py-2 text-sm font-semibold text-black shadow-md transition-transform transition-colors hover:scale-[1.02] hover:bg-[#E4FFD4]"
      >
        Mon espace
        <span class="text-lg leading-none">›</span>
      </RouterLink>
    </div>
  </header>
</template>

<script setup>
import MyLogo from '@/components/icons/MyLogo.vue'
import { RouterLink } from 'vue-router'
</script>
