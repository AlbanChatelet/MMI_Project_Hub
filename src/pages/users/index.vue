<!-- src/pages/users/index.vue -->
<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ref, onMounted } from "vue";
import { pb } from "../../pb";

const users = ref([]);
const loading = ref(true);
const error = ref(null);

onMounted(async () => {
  try {
    const res = await pb.collection("users").getFullList({
      sort: "name",
    });
    console.log("USERS CHARGÉS :", res);
    users.value = res;
  } catch (err) {
    console.error("Erreur chargement users :", err);
    error.value = err.message || String(err);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <main class="max-w-5xl mx-auto py-12 px-6">
    <h2 class="text-3xl font-bold mb-6 text-gray-900">
      Utilisateurs
    </h2>

    <p v-if="loading" class="text-gray-500">
      Chargement des utilisateurs...
    </p>

    <p v-else-if="error" class="text-red-600 font-medium">
      {{ error }}
    </p>

    <div v-else>
      <p class="text-gray-400 text-sm mb-4">
        {{ users.length }} utilisateur(s) trouvé(s)
      </p>

      <div
        v-if="users.length > 0"
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
      >
        <article
          v-for="user in users"
          :key="user.id"
          class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold"
            >
              {{ user.name?.charAt(0).toUpperCase() || "?" }}
            </div>

            <div>
              <h3 class="text-sm font-semibold text-gray-800">
                {{ user.name || "(Sans nom)" }}
              </h3>
              <p class="text-xs text-gray-500">
                {{ user.email }}
              </p>
            </div>
          </div>
        </article>
      </div>

      <p v-else class="text-gray-500 mt-4">
        Aucun utilisateur trouvé.
      </p>
    </div>
  </main>
</template>
