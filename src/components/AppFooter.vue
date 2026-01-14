<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { useRoute } from "vue-router";

const route = useRoute();
</script>

<template>
  <footer class="bg-[#151A24] border-t border-white/10">
    <div
      class="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row gap-6 md:items-center md:justify-between"
    >
      <!-- Left -->
      <div class="text-white/60 text-sm">
        <p class="font-semibold text-white">
          MMI Project Hub
        </p>
        <p>
          Plateforme collaborative de gestion et valorisation des projets étudiants
        </p>
        <p class="mt-2">
          © {{ new Date().getFullYear() }} — BUT MMI
        </p>
      </div>

      <!-- Right -->
      <nav class="flex flex-wrap gap-6 text-sm">
        <RouterLink
          to="/mentions_legales"
          class="text-white/70 hover:text-[#CFFFBC] transition"
        >
          Mentions légales
        </RouterLink>

        <RouterLink
          to="/politique_confidentialite"
          class="text-white/70 hover:text-[#CFFFBC] transition"
        >
          Politique de confidentialité
        </RouterLink>

        <RouterLink
          to="/securite_donnee"
          class="text-white/70 hover:text-[#CFFFBC] transition"
        >
          Sécurité des données
        </RouterLink>
      </nav>
    </div>
  </footer>
</template>
