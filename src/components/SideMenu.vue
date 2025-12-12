<template>
  <div>
    <button
      @click="toggleMenu"
      class="fixed top-4 right-4 z-50 p-2 rounded-full bg-gray-900 text-white shadow-lg focus:outline-none"
      aria-label="Toggle Menu"
    >
      <svg v-if="!isOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
      </svg>
      <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    </button>

    <transition name="fade">
      <div
        v-if="isOpen"
        @click="closeMenu"
        class="fixed inset-0 bg-black opacity-50 z-40"
      ></div>
    </transition>

    <transition name="slide">
      <div
        v-if="isOpen"
        class="fixed top-0 right-0 w-64 h-full bg-[#CCFFBC] shadow-xl z-50 p-6"
      >
        <h2 class="text-2xl font-bold mb-6 text-gray-800">Menu</h2>

        <nav class="space-y-4">
          <a href="/" class="block text-gray-700 hover:text-gray-900 font-medium transition duration-150">
            Accueil
          </a>
          <a href="#" class="block text-gray-700 hover:text-gray-900 font-medium transition duration-150">
            Galerie
          </a>
          <a href="#" class="block text-gray-700 hover:text-gray-900 font-medium transition duration-150">
            Mon espace
          </a>
          <a href="#" class="block text-gray-700 hover:text-gray-900 font-medium transition duration-150">
            A propos
          </a>
        </nav>

        <button
          @click="closeMenu"
          class="mt-8 text-sm text-red-500 hover:text-red-700"
        >
          Fermer le menu
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const isOpen = ref(false);

const toggleMenu = () => {
  isOpen.value = !isOpen.value;
};

const closeMenu = () => {
  isOpen.value = false;
};
</script>

<style scoped>
/* ------------------------------------- */
/* Transition pour le Menu Latéral (Slide) */
/* ------------------------------------- */

/* État initial (quand le menu entre) et final (quand il sort) */
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

/* État actif (définit la durée de la transition) */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease-out;
}

/* État d'arrivée (menu ouvert) */
.slide-enter-to,
.slide-leave-from {
  transform: translateX(0);
}

/* ------------------------------------- */
/* Transition pour l'Overlay (Fade) */
/* ------------------------------------- */

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
