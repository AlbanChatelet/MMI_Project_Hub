<script setup lang="ts">
import { ref } from "vue";
import { pb } from "@/pb";

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
    await pb.collection("users").create({
      email: email.value,
      password: password.value,
      passwordConfirm: password.value,
      username: username.value,
      name: name.value,
      type_utilisateur: type.value,
    });

    successMsg.value = "Compte créé ! Vous pouvez maintenant vous connecter.";
  } catch (err: any) {
    errorMsg.value = err.message;
  }
}
</script>

<template>
  <main class="min-h-screen flex justify-center items-center bg-gray-100 p-8">
    <div class="bg-white p-8 rounded-xl shadow-md w-full max-w-md space-y-4">

      <h2 class="text-2xl font-bold mb-4">Créer un compte</h2>

      <input v-model="username" placeholder="Nom d’utilisateur" class="input" />
      <input v-model="name" placeholder="Nom complet" class="input" />
      <input v-model="email" type="email" placeholder="Email" class="input" />
      <input v-model="password" type="password" placeholder="Mot de passe" class="input" />

      <select v-model="type" class="input">
        <option value="etudiant">Étudiant</option>
        <option value="prof">Professeur</option>
        <option value="admin">Admin</option>
      </select>

      <p v-if="errorMsg" class="text-red-500">{{ errorMsg }}</p>
      <p v-if="successMsg" class="text-green-600">{{ successMsg }}</p>

      <button @click="register" class="w-full bg-indigo-600 text-white p-3 rounded-lg">
        S’inscrire
      </button>
    </div>
  </main>
</template>

<style>
.input {
  @apply w-full p-3 border border-gray-300 rounded-lg;
}
</style>
