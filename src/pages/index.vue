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

// Format "Prénom NOM, Prénom NOM, ..."
const formatMembres = (projetId) => {
  const membres = getGroupeMembres(projetId);
  return membres
    .map((m) => m.name || m.username || m.email || "Membre")
    .join(", ");
};

onMounted(async () => {
  try {
    const [projetsRes, groupesRes] = await Promise.all([
      pb.collection("Projet").getFullList({ sort: "-created" }),
      pb.collection("Groupe").getFullList({
        expand: "membres",
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
  <main class="min-h-screen bg-slate-950">
    <section class="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h2 class="text-3xl sm:text-4xl font-bold text-white mb-8">
        Projets
      </h2>

      <!-- Chargement -->
      <p v-if="loading" class="text-slate-300">
        Chargement des projets...
      </p>

      <!-- Erreur -->
      <p v-else-if="error" class="text-red-400 font-medium">
        {{ error }}
      </p>

      <!-- Liste des projets -->
      <div v-else>
        <div
          v-if="projets.length > 0"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <!-- Carte projet façon maquette -->
          <RouterLink
            v-for="projet in projets"
            :key="projet.id"
            :to="`/projets/${projet.id}`"
            class="group relative block h-[320px] sm:h-[380px] lg:h-[480px] rounded-2xl overflow-hidden shadow-lg"
          >
            <!-- Image de fond -->
            <img
              v-if="projet.apercu"
              :src="pb.files.getUrl(projet, projet.apercu)"
              alt="Aperçu du projet"
              class="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
            />
            <!-- Si pas d'image, petit fond de secours -->
            <div
              v-else
              class="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-slate-300 text-sm"
            >
              Aucun aperçu
            </div>

            <!-- Overlay sombre -->
            <div
              class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
            />

            <!-- Contenu en bas -->
            <div class="absolute inset-x-0 bottom-0 p-4 sm:p-6">
              <h3
                class="text-xl sm:text-2xl font-semibold text-lime-300 mb-1 sm:mb-2"
              >
                {{ projet.titre || "(Sans titre)" }}
              </h3>

              <!-- Groupe -->
              <p
                v-if="getGroupeNom(projet.id)"
                class="text-xs sm:text-sm text-slate-100 mb-1"
              >
                {{ getGroupeNom(projet.id) }}
              </p>

              <!-- Membres -->
              <p
                v-if="getGroupeMembres(projet.id).length"
                class="flex items-start text-[11px] sm:text-xs text-slate-100"
              >
                <span class="mr-2 mt-0.5">👤</span>
                <span class="leading-snug">
                  {{ formatMembres(projet.id) }}
                </span>
              </p>
            </div>
          </RouterLink>
        </div>

        <p v-else class="text-slate-300 mt-4">
          Aucun projet trouvé dans PocketBase.
        </p>
      </div>
    </section>
  </main>
</template>
