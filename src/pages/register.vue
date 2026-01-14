<script setup lang="ts">
import { ref } from "vue";
import { pb } from "@/pb";
import { RouterLink } from "vue-router";
import MyLogo from "@/components/icons/MyLogo.vue";

const email = ref("");
const password = ref("");
const username = ref("");
const name = ref("");
const type = ref("etudiant");

const errorMsg = ref("");
const successMsg = ref("");

async function register() {
  errorMsg.value = "";
  successMsg.value = "";

  try {
    // (optionnel mais conseillé) : nettoyer un peu le username
    const cleanUsername = username.value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9._-]/g, "");

    await pb.collection("users").create({
      email: email.value.trim(),
      password: password.value,
      passwordConfirm: password.value,
      username: cleanUsername,
      name: name.value.trim(),
      type_utilisateur: type.value,
    });

    successMsg.value = "Compte créé ! Vous pouvez maintenant vous connecter.";
  } catch (err) {
    const e = err as any;

    // Affiche l'erreur PocketBase par champ si dispo
    const fieldErrors = e?.data?.data
      ? Object.entries(e.data.data)
          .map(([k, v]: any) => `${k}: ${v?.message || "invalide"}`)
          .join(" • ")
      : "";

    errorMsg.value =
      fieldErrors ||
      e?.data?.message ||
      e?.message ||
      "Erreur lors de la création du compte.";

    console.error("Erreur register :", e);
  }
}
</script>


<template>
  <!-- LOGO DESKTOP -->
  <RouterLink
    to="/"
    class="hidden md:flex fixed top-4 left-4 z-50 items-center gap-2"
  >
    <MyLogo class="w-48 drop-shadow-xl" />
  </RouterLink>

  <div class="flex flex-col md:flex-row min-h-screen">
    <!-- Section info (1/3) -->
    <div
      class="w-full md:w-1/3 bg-gray-bg bg-cover bg-center flex flex-col justify-center items-center p-6 sm:p-8"
    >
      <!-- LOGO MOBILE -->
      <RouterLink to="/" class="md:hidden mb-8">
        <MyLogo class="w-32 mx-auto drop-shadow-xl" />
      </RouterLink>

      <h2 class="text-xl sm:text-2xl text-white font-bold mb-3 sm:mb-4 text-center">
        Créez votre compte :
      </h2>

      <p class="mb-5 sm:mb-6 text-white text-center text-sm sm:text-base max-w-md">
        Rejoignez l’application de gestion des projets de MMI Montbéliard et accédez à vos projets, groupes et infos.
      </p>

      <RouterLink
        to="/login"
        class="block w-full max-w-md bg-[#CCFFBC] text-black p-3 rounded-lg text-center hover:bg-[#B8E6A8] transition"
      >
        Déjà un compte ? Se connecter
      </RouterLink>
    </div>

    <!-- Section formulaire (2/3) -->
    <div
      class="w-full md:w-2/3 bg-[#1A1D29] flex flex-col justify-center items-center p-6 sm:p-10 md:p-12"
    >
      <h2
        class="text-2xl sm:text-3xl md:text-4xl text-white font-bold mb-6 sm:mb-10 md:mb-12 text-center max-w-2xl"
      >
        Créer un compte
      </h2>

      <div class="w-full max-w-md md:max-w-xl md:w-2/3">
        <form class="space-y-4" @submit.prevent="register">
          <input v-model="username" placeholder="Nom d’utilisateur" class="input" />
          <input v-model="name" placeholder="Nom complet" class="input" />
          <input v-model="email" type="email" placeholder="Adresse email" class="input" />
          <input v-model="password" type="password" placeholder="Mot de passe" class="input" />

          <select v-model="type" class="input">
            <option value="etudiant">Étudiant</option>
            <option value="prof">Professeur</option>
            <option value="admin">Admin</option>
          </select>

          <!-- ERREUR / SUCCÈS -->
          <p v-if="errorMsg" class="text-red-400 text-sm">
            {{ errorMsg }}
          </p>
          <p v-if="successMsg" class="text-green-400 text-sm">
            {{ successMsg }}
          </p>

          <button
            type="submit"
            class="w-full bg-[#CCFFBC] text-black p-3 rounded-lg hover:bg-[#B8E6A8] transition font-semibold"
          >
            S’inscrire
          </button>

          <!-- Lien vers login (en bas, comme sur login vers register) -->
          <p class="text-center text-sm text-white/70">
            Déjà un compte ?
            <RouterLink to="/login" class="text-[#CCFFBC] font-medium hover:underline">
              Se connecter
            </RouterLink>
          </p>
        </form>
      </div>
    </div>
  </div>
</template>

<style>
.input {
  @apply w-full p-3 rounded-lg bg-white border border-gray-300;
  @apply focus:outline-none focus:ring-2 focus:ring-indigo-400;
}
</style>
