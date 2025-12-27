<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";

const isOpen = ref(false);

const open = () => (isOpen.value = true);
const close = () => (isOpen.value = false);
const toggle = () => (isOpen.value = !isOpen.value);

// fermer avec ESC
const onKeydown = (e) => {
  if (e.key === "Escape") close();
};

onMounted(() => window.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
</script>

<template>
  <header class="w-full bg-[#151A24] pt-6 pb-6">

    <div class="max-w-7xl mx-auto px-4 h-20 flex items-start justify-between">

      <!-- LOGO -->
      <RouterLink to="/" class="flex items-center gap-3">
        <img
  src="../assets/logo.svg"
  alt="MMI Project Hub"
  class="h-20 md:h-24 w-auto mt-2"
/>

      </RouterLink>

      <!-- BURGER -->
      <button
  type="button"
  class="text-[#CFFFBC] hover:opacity-80 transition p-3"
  @click="toggle"
  aria-label="Ouvrir le menu"
>
  <svg
    width="40"
    height="40"
    viewBox="0 0 24 24"
    fill="none"
  >
    <path d="M3 7h18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
    <path d="M3 12h18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
    <path d="M3 17h18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
  </svg>
</button>

    </div>

    <!-- OVERLAY (fond sombre) -->
    <!-- OVERLAY -->
<transition name="fade">
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 bg-black/60"
    @click.self="close"
  >
    <!-- PANEL à droite -->
    <transition name="slide">
      <aside
        v-if="isOpen"
        class="absolute top-0 right-0 h-full w-[80%] max-w-sm bg-[#CFFFBC] text-[#151A24] p-8"
        @click.stop
      >
        <!-- Bouton X -->
        <div class="flex justify-end">
          <button
            type="button"
            class="p-2 hover:opacity-70 transition"
            @click="close"
            aria-label="Fermer le menu"
          >
            ✕
          </button>
        </div>

        <!-- Liens -->
        <nav class="mt-10 flex flex-col gap-10 text-2xl font-extrabold">
          <RouterLink to="/eleve-dashboard" @click="close">Mon espace</RouterLink>
          <RouterLink to="/galerie" @click="close">Galerie</RouterLink>
          <RouterLink to="/sujets" @click="close">Liste des sujets</RouterLink>
          <RouterLink to="/proposer_projet" @click="close">Proposer un projet</RouterLink>
        </nav>
      </aside>
    </transition>
  </div>
</transition>

  </header>
</template>

<style scoped>
/* transitions overlay */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* slide panel */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.25s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
