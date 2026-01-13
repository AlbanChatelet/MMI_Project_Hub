<template>
  <header class="fixed top-6 md:top-12 left-0 right-0 z-50 px-4">
    <div
      class="relative mx-auto max-w-7xl rounded-2xl bg-[#191F2B] shadow-xl border border-white/5
             px-0"
    >
      <!-- ✅ Mobile: padding plus fin -->
      <div class="flex items-center justify-between px-3 py-2 md:px-10 md:py-3">
        <div class="relative md:absolute md:-top-10 md:left-10 lg:left-20 shrink-0">
          <MyLogo class="w-20 md:w-36 drop-shadow-xl" />
        </div>

        <div class="hidden md:block md:w-32 lg:w-44"></div>

        <!-- ✅ Desktop: Galerie juste à gauche de Mon espace -->
        <div class="hidden md:flex items-center gap-8 lg:gap-12 ml-auto">
          <RouterLink
            to="/galerie"
            class="text-sm font-medium text-[#CCFFBC] transition-colors hover:text-white"
          >
            Galerie
          </RouterLink>

          <RouterLink
  :to="espaceLink"
  class="flex items-center gap-2 rounded-full bg-[#CCFFBC] px-4 py-2 md:px-6
         text-xs md:text-sm font-semibold text-black shadow-md transition-all
         hover:scale-[1.02] hover:bg-[#E4FFD4] whitespace-nowrap"
>

            <span class="hidden xs:inline">Mon espace</span>
            <span class="inline xs:hidden">Espace</span>
            <span class="text-lg leading-none">›</span>
          </RouterLink>
        </div>

        <!-- ✅ Mobile: bouton "Mon espace" + burger -->
        <div class="flex items-center gap-3 md:hidden">
          <RouterLink
  :to="espaceLink"
  class="flex items-center gap-2 rounded-full bg-[#CCFFBC] px-3 py-1.5
         text-xs font-semibold text-black shadow-md transition-all
         hover:scale-[1.02] hover:bg-[#E4FFD4] whitespace-nowrap"
>

            <span class="hidden xs:inline">Mon espace</span>
            <span class="inline xs:hidden">Espace</span>
            <span class="text-lg leading-none">›</span>
          </RouterLink>

          <button
            @click="isMenuOpen = !isMenuOpen"
            class="text-[#CCFFBC] p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path v-if="!isMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
              <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <transition name="fade-slide">
        <!-- ✅ Mobile: padding menu plus fin + Projets à la une supprimé -->
        <div
          v-if="isMenuOpen"
          class="md:hidden bg-[#191F2B] rounded-b-2xl border-t border-white/10 p-4 flex flex-col gap-3"
        >
          <RouterLink
            to="/galerie"
            @click="isMenuOpen = false"
            class="text-[#CCFFBC] text-lg font-medium"
          >
            Galerie
          </RouterLink>
        </div>
      </transition>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import MyLogo from '@/components/icons/MyLogo.vue'
import { RouterLink } from 'vue-router'

const isMenuOpen = ref(false)

import { computed } from 'vue'


import { pb } from '@/pb'



// ✅ utilisateur connecté ?
const isAuthenticated = computed(() => pb.authStore.isValid)

// ✅ lien dynamique pour "Mon espace"
const espaceLink = computed(() =>
  isAuthenticated.value ? '/eleve-dashboard' : '/login'
)
</script>

<style scoped>
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.3s ease;
}
.fade-slide-enter-from, .fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Pour les téléphones très petits */
@media (max-width: 360px) {
  .xs\:inline { display: none; }
  .xs\:hidden { display: inline; }
}


</style>
