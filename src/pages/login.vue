<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <!-- LOGO DESKTOP -->
  <RouterLink
    to="/"
    class="hidden md:flex fixed top-4 left-4 z-50 items-center gap-2"
  >
    <MyLogo class="w-48 drop-shadow-xl" />
  </RouterLink>

  <div class="flex flex-col md:flex-row min-h-screen">
    <!-- Section soumettre un projet -->
    <div
      class="w-full md:w-1/3 bg-gray-bg bg-[#3D3F4A] bg-center flex flex-col justify-center items-center p-6 sm:p-8"
    >
      <!-- LOGO MOBILE -->
      <RouterLink
        to="/"
        class="md:hidden mb-8"
      >
        <MyLogo class="w-32 mx-auto drop-shadow-xl" />
      </RouterLink>

      <h2 class="text-xl sm:text-2xl text-white font-bold mb-3 sm:mb-4 text-center">
        Vous êtes une entreprise :
      </h2>

      <p class="mb-5 sm:mb-6 text-white text-center text-sm sm:text-base max-w-md">
        Soumettez une proposition de projet que nous étudierons et proposerons aux étudiants
      </p>

      <a
        href="/proposer_projet"
        class="block w-full max-w-md bg-[#CCFFBC] text-black p-3 rounded-lg text-center hover:bg-[#B8E6A8] transition"
      >
        Soumettre un projet
      </a>
    </div>

    <!-- Section connexion -->
    <div
      class="w-full md:w-2/3 bg-[#1A1D29] flex flex-col justify-center items-center p-6 sm:p-10 md:p-12"
    >
      <h2
        class="text-2xl sm:text-3xl md:text-4xl text-white font-bold mb-6 sm:mb-10 md:mb-12 text-center max-w-2xl"
      >
        Application de gestion des projets de MMI Montbéliard
      </h2>

      <h3 class="text-xl sm:text-2xl md:text-3xl text-white font-bold mb-4 sm:mb-6 text-center">
        Vous êtes étudiant ou enseignant ?
      </h3>

      <!-- Formulaire -->
      <form
        class="w-full max-w-md md:max-w-xl md:w-2/3 space-y-4"
        @submit.prevent="login"
      >
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

        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <label class="flex items-center space-x-2">
            <input type="checkbox" class="form-checkbox h-4 w-4 text-[#A3CC94]" />
            <span class="text-white text-sm sm:text-base">Se souvenir de moi</span>
          </label>

          <a href="#" class="text-[#A3CC94] hover:underline text-sm">
            Mot de passe oublié ?
          </a>
        </div>

        <p v-if="errorMessage" class="text-red-400 text-sm">
          {{ errorMessage }}
        </p>

        <button
  type="submit"
  class="w-full bg-[#CCFFBC] text-black p-3 rounded-lg hover:bg-[#B8E6A8] transition"
>
  Se connecter
</button>

<!-- INSCRIPTION -->
<p class="text-center text-sm text-white/70">
  Pas de compte ?
  <RouterLink
    to="/register"
    class="text-[#CCFFBC] font-medium hover:underline"
  >
    Créer un compte
  </RouterLink>
</p>

      </form>
    </div>
  </div>
</template>


<script setup lang="ts">
import MyLogo from "../components/icons/MyLogo.vue";
import { ref } from "vue";
import { useRouter, RouterLink } from "vue-router";
import { pb } from "../pb";

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

    if (role === "etudiant") router.push("/etudiant-dashboard");
    else if (role === "prof") router.push("/enseignant-dashboard");
    
    else router.push("/admin-dashboard");
  } catch (e) {
    errorMessage.value = "Email ou mot de passe incorrect.";
    console.error("Erreur connexion :", e);
  }
};
</script>

<style>
.cover {
  background-image: #3D3F4A
}
</style>
