<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import AppHeader from "@/components/AppHeader.vue";
</script>

<template>
  <div class="min-h-screen bg-[#151A24] text-white">
    <AppHeader />

    <div class="max-w-4xl mx-auto px-6 py-14">
      <h1 class="text-5xl font-extrabold mb-10">
        Politique de confidentialité
      </h1>

      <section class="space-y-10 text-white/80 leading-relaxed">
        <div>
          <h2 class="text-2xl font-bold text-white mb-2">
            Données collectées
          </h2>
          <p>
            Le site MMI Project Hub collecte uniquement les données nécessaires
            au fonctionnement pédagogique de la plateforme :
          </p>
          <ul class="list-disc list-inside mt-3">
            <li>Nom et prénom</li>
            <li>Adresse email institutionnelle</li>
            <li>Projets attribués et livrables déposés</li>
          </ul>
        </div>

        <div>
          <h2 class="text-2xl font-bold text-white mb-2">
            Finalité du traitement
          </h2>
          <p>
            Les données sont utilisées uniquement pour :
          </p>
          <ul class="list-disc list-inside mt-3">
            <li>La gestion des projets étudiants</li>
            <li>Le suivi pédagogique</li>
            <li>La valorisation des productions MMI</li>
          </ul>
        </div>

        <div>
          <h2 class="text-2xl font-bold text-white mb-2">
            Durée de conservation
          </h2>
          <p>
            Les données sont conservées pendant la durée de la formation,
            puis archivées à des fins pédagogiques et statistiques.
          </p>
        </div>

        <div>
          <h2 class="text-2xl font-bold text-white mb-2">
            Droits des utilisateurs
          </h2>
          <p>
            Conformément au RGPD, chaque utilisateur dispose des droits suivants :
          </p>
          <ul class="list-disc list-inside mt-3">
            <li>Droit d’accès</li>
            <li>Droit de rectification</li>
            <li>Droit à la suppression</li>
          </ul>
          <p class="mt-2">
            Toute demande peut être effectuée auprès de l’équipe pédagogique.
          </p>
        </div>
      </section>
    </div>
  </div>
</template>
