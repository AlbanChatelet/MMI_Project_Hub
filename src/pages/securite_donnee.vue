<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import AppHeader from "@/components/AppHeader.vue";
</script>

<template>
  <div class="min-h-screen bg-[#151A24] text-white">
    <AppHeader />

    <div class="max-w-4xl mx-auto px-6 py-14">
      <h1 class="text-5xl font-extrabold mb-10">
        Sécurité des données
      </h1>

      <section class="space-y-8 text-white/80 leading-relaxed">
        <div>
          <h2 class="text-2xl font-bold text-white mb-2">
            Protection des accès
          </h2>
          <p>
            L’accès à la plateforme est sécurisé par un système
            d’authentification avec des rôles distincts :
            étudiant, enseignant et administrateur.
          </p>
        </div>

        <div>
          <h2 class="text-2xl font-bold text-white mb-2">
            Stockage des données
          </h2>
          <p>
            Les données sont stockées sur des serveurs sécurisés et
            ne sont accessibles qu’aux personnes autorisées.
          </p>
        </div>

        <div>
          <h2 class="text-2xl font-bold text-white mb-2">
            Prévention et bonnes pratiques
          </h2>
          <ul class="list-disc list-inside">
            <li>Contrôle des droits d’accès</li>
            <li>Protection contre les accès non autorisés</li>
            <li>Sensibilisation à la confidentialité des données</li>
          </ul>
        </div>
      </section>
    </div>
  </div>
</template>
