<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ref, onMounted } from "vue";
import { pb } from "../pb";

const projets = ref([]);
const groupes = ref([]);
const loading = ref(true);
const error = ref(null);

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

// Retourne la liste des membres (users) du groupe lié au projet
const getGroupeMembres = (projetId) => {
  const groupe = getGroupeByProjetId(projetId);
  const membres = groupe?.expand?.membres;
  if (!Array.isArray(membres)) return [];
  return membres;
};

onMounted(async () => {
  try {
    const [projetsRes, groupesRes] = await Promise.all([
      pb.collection("Projet").getFullList({ sort: "-created" }),
      pb.collection("Groupe").getFullList({
        expand: "membres", // le champ relation vers users DOIT s'appeler "membres"
      }),
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
  <main class="max-w-5xl mx-auto py-12 px-6">
    <h2 class="text-3xl font-bold text-gray-900 mb-6">
      Projets
    </h2>

    <!-- Chargement -->
    <p v-if="loading" class="text-gray-500">
      Chargement des projets...
    </p>

    <!-- Erreur -->
    <p v-else-if="error" class="text-red-600 font-medium">
      {{ error }}
    </p>

    <!-- Liste des projets -->
    <div v-else>
      <div
        v-if="projets.length > 0"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <article
          v-for="projet in projets"
          :key="projet.id"
          class="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow duration-150"
        >
          <!-- Image d'aperçu -->
          <img
            v-if="projet.apercu"
            :src="pb.files.getUrl(projet, projet.apercu)"
            alt="Aperçu du projet"
            class="w-full h-40 object-cover rounded-lg mb-4"
          />

          <!-- Titre -->
          <h3 class="text-xl font-semibold text-gray-800">
            {{ projet.titre || "(Sans titre)" }}
          </h3>

          <!-- Nom du groupe -->
          <p
            v-if="getGroupeNom(projet.id)"
            class="text-sm text-gray-500 mt-1"
          >
            Groupe : {{ getGroupeNom(projet.id) }}
          </p>

          <!-- Membres du groupe -->
          <ul
            v-if="getGroupeMembres(projet.id).length"
            class="mt-1 text-xs text-gray-500 space-y-0.5"
          >
            <li
              v-for="membre in getGroupeMembres(projet.id)"
              :key="membre.id"
            >
              👤 {{ membre.name || membre.username || membre.email }}
            </li>
          </ul>

          <!-- Description -->
          <p class="text-gray-600 mt-2 line-clamp-3">
            {{ projet.description || "Aucune description fournie." }}
          </p>

          <!-- Footer carte -->
          <div class="mt-4 flex items-center justify-between">
            <span class="text-xs text-gray-400">
              ID : {{ projet.id }}
            </span>

            <RouterLink
              :to="`/projets/${projet.id}`"
              class="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Voir plus
            </RouterLink>
          </div>
        </article>
      </div>

      <p v-else class="text-gray-500 mt-4">
        Aucun projet trouvé dans PocketBase.
      </p>
    </div>
  </main>
</template>
