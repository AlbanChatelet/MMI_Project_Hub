<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="flex h-screen">
    <!-- Section soumettre un projet (1/3 de l'écran) -->
    <div class="w-1/3 bg-gray-bg bg-cover bg-center flex flex-col justify-center items-center p-8">
      <h2 class="text-2xl text-white font-bold mb-4 text-center">Vous êtes une entreprise :</h2>
      <p class="mb-6 text-white text-center">
        Soumettez une proposition de projet que nous étudierons et proposerons aux étudiants
      </p>
      <a
        href="/proposer_projet"
        class="block w-full bg-[#CCFFBC] text-black p-3 rounded-lg text-center hover:bg-[#B8E6A8] transition"
      >
        Soumettre un projet
      </a>
    </div>

    <!-- Section connexion (2/3 de l'écran) -->
    <div class="w-2/3 bg-[#1A1D29] flex flex-col justify-center items-center p-12">
      <h2 class="text-4xl text-white font-bold mb-12 pb-12">
        Application de gestion des projets de MMI Montbéliard
      </h2>
      <h3 class="text-3xl text-white font-bold mb-6">Vous êtes étudiant ou enseignant ?</h3>

      <!-- Formulaire -->
      <form class="w-2/3 space-y-4" @submit.prevent="login">
        <input
          type="email"
          placeholder="Adresse email"
          v-model="email"
          class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />

        <input
          type="password"
          placeholder="Mot de passe"
          v-model="password"
          class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />

        <div class="flex items-center justify-between">
          <label class="flex items-center space-x-2">
            <input type="checkbox" class="form-checkbox h-4 w-4 text-[#A3CC94]" />
            <span class="text-white">Se souvenir de moi</span>
          </label>
          <a href="#" class="text-[#A3CC94] hover:underline text-sm">Mot de passe oublié ?</a>
        </div>

        <!-- ERREUR -->
        <p v-if="errorMessage" class="text-red-400 text-sm">{{ errorMessage }}</p>

        <button
          type="submit"
          class="w-full bg-[#CCFFBC] text-black p-3 rounded-lg hover:bg-[#B8E6A8] transition"
        >
          Se connecter
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { pb } from "../pb"; // ✅ utilise la même instance !

const router = useRouter();

const email = ref("");
const password = ref("");
const errorMessage = ref("");

const login = async () => {
  errorMessage.value = "";

  try {
    const auth = await pb
      .collection("users")
      .authWithPassword(email.value, password.value);

    const role = auth.record.role;

    if (role === "admin") router.push("/admin-dashboard");
    else if (role === "enseignant") router.push("/enseignant-dashboard");
    else router.push("/eleve-dashboard");
  } catch (e) {
    errorMessage.value = "Email ou mot de passe incorrect.";
    console.error("Erreur connexion :", e);
  }
};
</script>

<style>
/* Aucun style additionnel nécessaire grâce à TailwindCSS */
</style>
