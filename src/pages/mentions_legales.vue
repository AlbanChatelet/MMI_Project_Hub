<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import AppHeader from "@/components/AppHeader.vue";
</script>

<template>
  <div class="min-h-screen bg-[#151A24] text-white">
    <AppHeader />

    <div class="max-w-4xl mx-auto px-6 py-14">
      <h1 class="text-5xl font-extrabold mb-10">Mentions légales</h1>

      <section class="space-y-8 text-white/80 leading-relaxed">
        <div>
          <h2 class="text-2xl font-bold text-white mb-2">Éditeur du site</h2>
          <p>
            MMI Project Hub<br />
            Projet pédagogique – BUT MMI<br />
            IUT MMI Montbéliard<br />
          </p>
        </div>

        <div>
          <h2 class="text-2xl font-bold text-white mb-2">Responsable de la publication</h2>
          <p>
            Équipe pédagogique MMI<br />
            Contact : albanchatelet20@gmail.com
          </p>
        </div>

        <div>
          <h2 class="text-2xl font-bold text-white mb-2">Hébergement</h2>
          <p>
            Hébergement : Infomaniak<br />
            Adresse : Infomaniak Network SA, Rue Eugène Marziano 25, 1227 Les Acacias (GE)
          </p>
        </div>

        <div>
          <h2 class="text-2xl font-bold text-white mb-2">Propriété intellectuelle</h2>
          <p>
            Les contenus (textes, images, projets, livrables) publiés sur MMI Project Hub
            restent la propriété de leurs auteurs respectifs. Toute reproduction sans
            autorisation est interdite.
          </p>
        </div>

        <div>
  <h2 class="text-2xl font-bold text-white mb-2">Données personnelles</h2>
  <p>
    Le site MMI Project Hub ne collecte aucune donnée personnelle à des fins
    commerciales. Les données éventuellement recueillies (comptes utilisateurs,
    projets) sont utilisées uniquement dans le cadre pédagogique du projet.
  </p>
</div>
      </section>
    </div>
  </div>
</template>
