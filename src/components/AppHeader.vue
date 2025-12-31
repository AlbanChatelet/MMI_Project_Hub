<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from "vue";

const props = defineProps({
  variant: {
    type: String,
    default: "solid", // "solid" | "transparent"
  },
});

const isOpen = ref(false);

const close = () => (isOpen.value = false);
const toggle = () => (isOpen.value = !isOpen.value);

// ESC
const onKeydown = (e) => {
  if (e.key === "Escape") close();
};
onMounted(() => window.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));

const isTransparent = computed(() => props.variant === "transparent");
</script>

<template>
  <!-- HEADER -->
  <header
    class="w-full z-40"
    :class="isTransparent ? 'fixed top-0 left-0 bg-transparent' : 'relative bg-[#151A24]'"
  >
    <div
      class="max-w-7xl mx-auto flex items-center justify-between"
      :class="isTransparent ? 'px-10 pt-8 pb-4' : 'px-10 py-6'"
    >
      <!-- LOGO -->
      <RouterLink to="/" class="flex items-center">
        <img
          src="../assets/logo.svg"
          alt="MMI Project Hub"
          class="w-[120px] md:w-[150px] h-auto"
        />
      </RouterLink>

      <!-- BURGER -->
      <button
        type="button"
        class="text-[#CFFFBC] hover:opacity-80 transition p-2"
        @click="toggle"
        aria-label="Ouvrir le menu"
      >
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
          <path d="M4 7h16" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
          <path d="M4 12h16" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
          <path d="M4 17h16" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
        </svg>
      </button>
    </div>

    <!-- OVERLAY -->
    <transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 bg-black/60"
        @click.self="close"
      >
        <!-- PANEL -->
        <transition name="slide">
          <aside
            v-if="isOpen"
            class="absolute top-0 right-0 h-full w-[80%] max-w-sm bg-[#CFFFBC] text-[#151A24] p-8"
            @click.stop
          >
            <div class="flex justify-end">
              <button
                type="button"
                class="p-2 hover:opacity-70 transition text-3xl leading-none"
                @click="close"
                aria-label="Fermer le menu"
              >
                ✕
              </button>
            </div>

            <nav class="mt-12 flex flex-col gap-10 text-2xl font-extrabold">
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

  <!-- spacer si header fixed (pour pas que le contenu passe sous le header) -->
  
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.25s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
