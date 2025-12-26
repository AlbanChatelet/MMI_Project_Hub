<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { computed } from "vue";
import { pb } from "../pb";

const user = computed(() => pb.authStore.model);

const avatarUrl = computed(() => {
  if (!user.value) return null;
  const filename = user.value.avatar;
  if (!filename) return null;
  return pb.files.getUrl(user.value, filename);
});
</script>

<template>
  <main class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="bg-white p-8 rounded-xl shadow-md text-center w-96">
      <h1 class="text-3xl font-bold mb-6">Dashboard Élève</h1>

      <div class="flex justify-center mb-4">
        <img
          v-if="avatarUrl"
          :src="avatarUrl"
          alt="Avatar"
          class="w-24 h-24 rounded-full object-cover border"
        />
        <div
          v-else
          class="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center text-3xl font-bold text-gray-600"
        >
          {{ user?.name?.charAt(0).toUpperCase() || "?" }}
        </div>
      </div>

      <p v-if="user" class="text-lg text-gray-700">
        Bonjour <span class="font-semibold">{{ user.name }}</span> 👋
      </p>

      <!-- DEBUG (tu pourras enlever après) -->
      <div class="mt-4 text-left text-xs text-gray-500 break-words">
        <p><b>avatar filename :</b> {{ user?.avatar || "(vide)" }}</p>
        <p><b>avatar url :</b> {{ avatarUrl || "(null)" }}</p>
      </div>
    </div>
  </main>
</template>
