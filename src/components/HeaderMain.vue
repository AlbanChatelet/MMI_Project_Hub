<template>
  <!-- Header flottant, centré -->
  <header
    class="fixed top-12 left-1/2 z-50 w-full -translate-x-1/2 px-4"
  >
    <!-- Barre principale -->
    <div
      class="relative mx-auto max-w-7xl rounded-2xl bg-[#191F2B] shadow-xl"
    >
      <!-- Logo qui dépasse -->
      <div class="absolute -top-12 left-28">
        <MyLogo class="w-28 md:w-36 drop-shadow-xl" />
      </div>

      <!-- Contenu de la barre -->
      <div
        class="flex items-center justify-between px-6 py-3 lg:px-10 lg:py-3 pl-32 md:pl-44"
      >
        <!-- Nav centrale -->
        <nav class="hidden gap-12 text-sm font-medium text-[#CCFFBC] md:flex mx-auto">
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
          class="ml-4 flex items-center gap-2 rounded-full bg-[#CCFFBC] px-6 py-2 
                 text-sm font-semibold text-black shadow-md transition-transform transition-colors 
                 hover:scale-[1.02] hover:bg-[#E4FFD4]"
        >
          Mon espace
          <span class="text-lg leading-none">›</span>
        </RouterLink>
      </div>
    </div>
  </header>
</template>

<script setup>
import MyLogo from '@/components/icons/MyLogo.vue'
import { RouterLink } from 'vue-router'
</script>
