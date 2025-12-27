<template>
  <AppHeader />
  <div class="min-h-screen bg-[#0E1116] text-white px-6 py-10">
    

    <!-- Titre -->
    <h1 class="text-3xl font-bold mb-2">Proposer un projet</h1>
    <p class="text-gray-300 max-w-xl mb-10">
      Proposez vos projets ici, votre proposition sera examinée par un administrateur et
      ajoutée à la liste des sujets s’il correspond aux attendus de MMI.
    </p>

    <!-- Form -->
    <form class="max-w-2xl space-y-8">

      <!-- Nom du projet -->
      <div>
        <label class="block mb-2">Nom du projet*</label>
        <input
          type="text"
          class="w-full bg-transparent border border-gray-400 rounded-md px-3 py-2"
        />
      </div>

      <!-- Description -->
      <div>
        <label class="block mb-2">Description du projet*</label>
        <textarea
          rows="4"
          class="w-full bg-transparent border border-gray-400 rounded-md px-3 py-2"
        ></textarea>
      </div>

      <!-- Objectifs -->
      <div>
        <label class="block mb-2">Objectifs du projet*</label>
        <textarea
          rows="3"
          class="w-full bg-transparent border border-gray-400 rounded-md px-3 py-2"
        ></textarea>
      </div>

      <!-- Compétences -->
      <div>
        <label class="block mb-2">Compétences mobilisées</label>

        <input
          type="text"
          placeholder="Créer une maquette"
          class="w-full bg-[#2A2C32] border border-gray-500 rounded-md px-3 py-2"
        />

        <button
          type="button"
          class="w-full mt-2 text-gray-300 border border-gray-500 px-3 py-1 rounded-md text-sm"
        >
          + Ajouter une compétence
        </button>
      </div>

      <!-- Documents -->
      <div>
        <label class="block mb-3">Documents et liens utiles</label>

        <div class="grid grid-cols-2 gap-4 max-w-sm mb-3">
          <button
            type="button"
            class="bg-[#2A2C32] p-4 rounded-md flex flex-col items-center gap-2 border border-gray-500"
          >
            <div class="w-8 h-8 bg-green-300 rounded"></div>
            <span>Image de marque</span>
          </button>

          <button
            type="button"
            class="bg-[#2A2C32] p-4 rounded-md flex flex-col items-center gap-2 border border-gray-500"
          >
            <div class="w-8 h-8 bg-green-300 rounded"></div>
            <span>Sujet</span>
          </button>
        </div>

        <button
          type="button"
          class="w-full text-gray-300 border border-gray-500 px-3 py-1 rounded-md text-sm"
        >
          + Ajouter un document
        </button>
      </div>

      <!-- Email -->
      <div>
        <label class="block mb-2">Adresse email*</label>
        <input
          type="email"
          class="w-full bg-transparent border border-gray-400 rounded-md px-3 py-2"
        />
      </div>

      <!-- Submit -->
      <button
        type="submit"
        class="w-full bg-[#CCFFBC] text-black py-3 rounded-full hover:bg-[#B8E6A8] transition font-medium"
      >
        Envoyer la proposition
      </button>
    </form>
  </div>
</template>

<script setup>
import AppHeader from '@/components/AppHeader.vue'
</script>
