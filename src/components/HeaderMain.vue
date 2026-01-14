<template>
  <header class="fixed top-3 md:top-12 left-0 right-0 z-50 px-3 md:px-4">
    <div
      class="relative mx-auto max-w-7xl rounded-2xl bg-[#191F2B] shadow-xl border border-white/5"
    >
      <!-- ✅ Mobile: header moins haut -->
      <div class="flex items-center justify-between px-3 py-2 md:px-10 md:py-5">
        <!-- ✅ Logo plus petit en mobile -->
        <div
          class="relative md:absolute md:top-1/2 md:-translate-y-1/2 md:left-10 lg:left-20 shrink-0 leading-none"
        >
          <MyLogo class="w-12 h-12 md:w-[160px] md:mt-1 md:h-auto drop-shadow-xl" />
        </div>

        <div class="hidden md:block md:w-32 lg:w-44"></div>

        <!-- ✅ Desktop -->
        <div class="hidden md:flex items-center gap-8 lg:gap-12 ml-auto">
          <!-- ✅ Nouveau bouton à gauche de Galerie -->
          <RouterLink
            to="/proposer_projet"
            class="text-sm font-medium text-[#CCFFBC] transition-colors hover:text-white"
          >
            Proposer un sujet
          </RouterLink>

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
            <span class="hidden xs:inline">Espace</span>
            <span class="inline xs:hidden">Mon espace</span>
            <span class="text-lg leading-none">›</span>
          </RouterLink>
        </div>

        <!-- ✅ Mobile -->
        <div class="flex items-center gap-2 md:hidden">
          <RouterLink
            :to="espaceLink"
            class="flex items-center gap-2 rounded-full bg-[#CCFFBC] px-3 py-1
                  text-xs font-semibold text-black shadow-md transition-all
                  hover:scale-[1.02] hover:bg-[#E4FFD4] whitespace-nowrap"
          >
            <span class="hidden xs:inline">Mon espace</span>
            <span class="inline xs:hidden">Espace</span>
            <span class="text-lg leading-none">›</span>
          </RouterLink>

          <!-- ✅ Burger -->
          <button
            @click="isMenuOpen = !isMenuOpen"
            class="text-[#CCFFBC] p-1"
            aria-label="Menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path v-if="!isMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
              <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <transition name="fade-slide">
        <div
          v-if="isMenuOpen"
          class="md:hidden bg-[#191F2B] rounded-b-2xl border-t border-white/10 px-4 py-3 flex flex-col gap-3"
        >
          <!-- ✅ Nouveau lien dans le menu mobile -->
          <RouterLink
            to="/proposer_projet"
            @click="isMenuOpen = false"
            class="text-[#CCFFBC] text-lg font-medium"
          >
            Proposer un sujet
          </RouterLink>

          <RouterLink
            to="/galerie"
            @click="isMenuOpen = false"
            class="text-[#CCFFBC] text-lg font-medium"
          >
            Galerie
          </RouterLink>

          <RouterLink
            :to="espaceLink"
            @click="isMenuOpen = false"
            class="text-[#CCFFBC] text-lg font-medium"
          >
            Mon espace
          </RouterLink>
        </div>
      </transition>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from "vue";
import MyLogo from "@/components/icons/MyLogo.vue";
import { RouterLink } from "vue-router";
import { pb } from "@/pb";

const isMenuOpen = ref(false);

const isAuthenticated = computed(() => pb.authStore?.isValid);

// récupère l'utilisateur auth (selon ton code, parfois c'est model, parfois record)
const authUser = computed(() => pb.authStore?.model || pb.authStore?.record || null);

const userType = computed(() =>
  String(
    authUser.value?.type_utilisateur ||
    authUser.value?.type ||
    authUser.value?.role ||
    ""
  ).toLowerCase()
);

// ✅ lien espace selon type
const espaceLink = computed(() => {
  if (!isAuthenticated.value) return "/login";

  if (userType.value === "admin") return "/admin-dashboard";
  if (userType.value === "prof" || userType.value === "enseignant") return "/enseignant-dashboard";

  // défaut: étudiant
  return "/eleve-dashboard";
});
</script>

<style scoped>
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.3s ease;
}
.fade-slide-enter-from, .fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 360px) {
  .xs\:inline { display: none; }
  .xs\:hidden { display: inline; }
}
</style>
