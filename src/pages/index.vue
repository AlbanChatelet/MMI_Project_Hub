<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ref, onMounted } from "vue";
import { pb } from "../pb";
import HeaderMain from "../components/HeaderMain.vue";
import UserIcon from "../components/icons/UserIcon.vue";

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

const getGroupeMembres = (projetId) => {
  const groupe = getGroupeByProjetId(projetId);
  const membres = groupe?.expand?.membres;
  return Array.isArray(membres) ? membres : [];
};

// Affiche max 3 membres + "+X"
const formatMembres = (projetId, max = 3) => {
  const membres = getGroupeMembres(projetId);
  const names = membres.map((m) => m.name || m.username || m.email);

  const shown = names.slice(0, max);
  const remaining = names.length - shown.length;

  return remaining > 0 ? `${shown.join(", ")} +${remaining}` : shown.join(", ");
};

onMounted(async () => {
  try {
    const [projetsRes, groupesRes] = await Promise.all([
      pb.collection("Projet").getList(1, 4, {
        filter: "favoris = true",
        sort: "-created",
      }),
      pb.collection("Groupe").getFullList({ expand: "membres" }),
    ]);

    projets.value = projetsRes.items;
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
  <div
    class="w-full h-screen bg-black relative overflow-y-auto md:overflow-hidden text-[#CCFFBC]"
  >
    <!-- Header -->
    <HeaderMain />

    <main class="w-full h-full">
      <!-- Loading -->
      <p v-if="loading" class="text-center mt-10 text-xl">Chargement...</p>

      <!-- Erreur -->
      <p v-else-if="error" class="text-red-500 text-center mt-10 text-xl">
        {{ error }}
      </p>

      <!-- Grille -->
      <div v-else class="grid grid-cols-1 md:grid-cols-4 w-full h-auto md:h-full">
        <RouterLink
          v-for="projet in projets"
          :key="projet.id"
          :to="`/projets/${projet.id}`"
          class="
            relative group overflow-hidden h-screen md:h-full
            text-[#CCFFBC]

            border-b-2 border-[#CCFFBC]
            md:border-b-0 md:border-r-2
            last:border-b-0 md:last:border-r-0
          "
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
            class="absolute inset-0 bg-gray-800 flex items-center justify-center"
          >
            Aucun aperçu
          </div>

          <!-- Overlay -->
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>

          <!-- Contenu -->
          <div class="absolute bottom-0 left-0 right-0 p-6">
            <h3 class="text-5xl font-bold drop-shadow-lg">
              {{ projet.titre }}
            </h3>

            <p
              v-if="getGroupeMembres(projet.id).length"
              class="text-xs mt-3 leading-snug flex items-start gap-2"
            >
              <UserIcon class="mt-[2px] shrink-0" />
              <span>
                {{ formatMembres(projet.id, 3) }}
              </span>
            </p>
          </div>
        </RouterLink>
      </div>
    </main>
  </div>
</template>
