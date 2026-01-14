<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ref, onMounted, computed } from "vue";
import { pb } from "../pb";
import HeaderMain from "../components/HeaderMain.vue";

const projets = ref([]);
const groupes = ref([]);
const loading = ref(true);
const error = ref(null);

// 🔹 seulement les 4 premiers projets
const projetsLimites = computed(() => projets.value.slice(0, 4));

// Trouve le groupe associé à un projet
const getGroupeByProjetId = (projetId) => {
  return groupes.value.find(
    (g) =>
      g.projet === projetId ||
      (Array.isArray(g.projet) && g.projet.includes(projetId))
  );
};

const getGroupeNom = (projetId) => {
  const groupe = getGroupeByProjetId(projetId);
  return groupe?.nom || null;
};

const getGroupeMembres = (projetId) => {
  const groupe = getGroupeByProjetId(projetId);
  const membres = groupe?.expand?.membres;
  return Array.isArray(membres) ? membres : [];
};

const formatMembres = (projetId) => {
  return getGroupeMembres(projetId)
    .map((m) => m.name || m.username || m.email)
    .join(", ");
};

onMounted(async () => {
  try {
    const [projetsRes, groupesRes] = await Promise.all([
      pb.collection("Projet").getFullList({ sort: "-created" }),
      pb.collection("Groupe").getFullList({ expand: "membres" }),
    ]);

    projets.value = projetsRes;
    groupes.value = groupesRes;
  } catch (err) {
    console.error(err);
    error.value = err.message || "Erreur lors du chargement des projets";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <!-- Wrapper global -->
  <div class="w-full h-screen bg-black relative overflow-y-auto md:overflow-hidden">
    <!-- Header -->
    <HeaderMain />

    <main class="w-full h-full">
      <!-- Loading -->
      <p v-if="loading" class="text-white text-center mt-10 text-xl">
        Chargement...
      </p>

      <!-- Erreur -->
      <p v-else-if="error" class="text-red-500 text-center mt-10 text-xl">
        {{ error }}
      </p>

      <!-- Grille -->
      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-4 w-full h-auto md:h-full"
      >
        <RouterLink
          v-for="projet in projetsLimites"
          :key="projet.id"
          :to="`/projets/${projet.id}`"
          class="relative group overflow-hidden h-screen md:h-full"
        >
          <!-- Image -->
          <img
            v-if="projet.photo"
            :src="pb.files.getUrl(projet, projet.photo)"
            class="absolute inset-0 w-full h-full object-cover transform group-hover:scale-110 transition duration-700"
            alt="Aperçu du projet"
          />

          <div
            v-else
            class="absolute inset-0 bg-gray-800 flex items-center justify-center text-white"
          >
            Aucun aperçu
          </div>

          <!-- Overlay -->
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>

          <!-- Contenu -->
          <div class="absolute bottom-0 left-0 right-0 p-6">
            <h3 class="text-white text-3xl font-bold drop-shadow-lg">
              {{ projet.titre }}
            </h3>

            <p v-if="getGroupeNom(projet.id)" class="text-white/90 text-sm mt-1">
              {{ getGroupeNom(projet.id) }}
            </p>

            <p
              v-if="getGroupeMembres(projet.id).length"
              class="text-white/80 text-xs mt-1 leading-snug"
            >
              👤 {{ formatMembres(projet.id) }}
            </p>
          </div>
        </RouterLink>
      </div>
    </main>
  </div>
</template>
