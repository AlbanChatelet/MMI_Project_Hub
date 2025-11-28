<template>
  <div class="flex h-screen">
    <!-- Section soumettre un projet (1/3 de l'écran) -->
    <div class="w-1/3 bg-src\assets\bg_img_gray.png flex flex-col justify-center items-center p-8">
      <h2 class="text-2xl font-bold
       mb-4 text-center">Vous êtes une entreprise :</h2>
      <p class="mb-6 text-center">Soumettez une proposition de projet que nous étudierons et proposerons aux étudiants</p>
      <form class="w-full space-y-4">
        <input
          type="text"
          placeholder="Nom de l'entreprise"
          class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="text"
          placeholder="Titre du projet"
          class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <textarea
          placeholder="Description du projet"
          class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          rows="4"
        ></textarea>
        <button
          type="submit"
          class="w-full bg-[#CCFFBC] text-white p-3 rounded-lg hover:bg-blue-600 transition"
        >
          Soumettre
        </button>
      </form>
    </div>

    <!-- Section connexion (2/3 de l'écran) -->
    <div class="w-2/3 bg-gray-50 flex flex-col justify-center items-center p-12">
      <h2 class="text-3xl font-bold mb-6">Connexion Étudiant / Enseignant</h2>
      <form class="w-2/3 space-y-4">
        <input
          type="email"
          placeholder="Adresse email"
          class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <input
          type="password"
          placeholder="Mot de passe"
          class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <div class="flex items-center justify-between">
          <label class="flex items-center space-x-2">
            <input type="checkbox" class="form-checkbox h-4 w-4 text-indigo-500" />
            <span>Se souvenir de moi</span>
          </label>
          <a href="#" class="text-indigo-500 hover:underline text-sm">Mot de passe oublié ?</a>
        </div>
        <button
          type="submit"
          class="w-full bg-[#CCFFBC] text-white p-3 rounded-lg hover:bg-indigo-600 transition"
        >
          Se connecter
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
// Ici, tu pourrais gérer les soumissions de formulaire avec des fonctions asynchrones
</script>

<style>
/* Aucun style additionnel nécessaire grâce à TailwindCSS */
</style>
