<script setup>
import AppHeader from "@/components/AppHeader.vue";
import { pb } from "../pb";
import { ref, computed, onMounted } from "vue";
import { RouterLink, useRouter } from "vue-router";

const router = useRouter();

const loading = ref(true);
const error = ref(null);

const user = ref(pb.authStore.model);
const sujets = ref([]);

// ---- Helpers UI
const displayName = computed(() => user.value?.name || user.value?.username || "Utilisateur");
const userType = computed(() => user.value?.type_utilisateur || user.value?.type || user.value?.role || "");

const anneeLabelText = (annee) => {
  const a = String(annee);
  if (a === "1") return "1ère année";
  if (a === "2") return "2ème année";
  if (a === "3") return "3ème année";
  return `${a}ème année`;
};

const typeSujetLabel = (t) => {
  const v = String(t || "").toLowerCase();
  if (v === "solo") return "Solo";
  if (v === "collectif") return "Collectif";
  return t || "—";
};

const imageMarqueUrl = (s) => {
  if (!s?.image_marque) return null;
  return pb.files.getURL(s, s.image_marque);
};

const sujetPdfUrl = (s) => {
  if (!s?.sujet_pdf) return null;
  return pb.files.getURL(s, s.sujet_pdf);
};

// ✅ sécurité (UI) : uniquement prof/admin/enseignant
const canAccess = computed(() => {
  const t = String(userType.value).toLowerCase();
  return t === "prof" || t === "admin" || t === "enseignant";
});

// ✅ Déconnexion
const logout = async () => {
  try {
    pb.authStore.clear();
    user.value = null;
    sujets.value = [];
    await router.push("/login"); // adapte si ta route login est différente
  } catch (e) {
    console.error(e);
    error.value = "Erreur lors de la déconnexion";
  }
};

onMounted(async () => {
  loading.value = true;
  error.value = null;

  try {
    if (!pb.authStore.isValid || !pb.authStore.model?.id) {
      throw new Error("Utilisateur non connecté");
    }

    // user complet
    user.value = await pb.collection("users").getOne(pb.authStore.model.id);

    if (!canAccess.value) {
      return;
    }

    // sujets proposés par cet utilisateur
    sujets.value = await pb.collection("sujets").getFullList({
      filter: `commanditaire="${user.value.id}"`,
      sort: "-created",
    });
  } catch (e) {
    console.error(e);
    error.value = e?.message || "Erreur lors du chargement";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <AppHeader />

  <div class="min-h-screen bg-[#151A24] text-white">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <p v-if="loading" class="text-white/70">Chargement...</p>
      <p v-else-if="error" class="text-red-300">{{ error }}</p>

      <template v-else>
        <!-- Si pas autorisé -->
        <div
          v-if="!canAccess"
          class="min-h-[calc(100vh-140px)] flex items-center justify-center"
        >
          <div
            class="max-w-xl w-full text-center bg-white/5 border border-white/10 rounded-3xl p-8 sm:p-10"
          >
            <h1 class="text-3xl font-extrabold mb-3">Accès restreint</h1>
            <p class="text-white/70">
              Vous n’avez pas les droits pour accéder au tableau de bord enseignant.
            </p>
            <RouterLink
              to="/"
              class="inline-flex mt-6 px-6 py-3 rounded-full bg-[#CCFFBC] text-black font-semibold hover:bg-[#B8E6A8] transition"
            >
              Retour à l’accueil
            </RouterLink>
          </div>
        </div>

        <!-- Dashboard enseignant -->
        <template v-else>
          <!-- Header haut -->
          <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight">
                Bonjour, <span class="text-[#CCFFBC]">{{ displayName }}</span>
              </h1>
              <p class="text-white/60 mt-2">
                Tableau de bord enseignant • Vos sujets proposés
              </p>

              <!-- ✅ Bouton déconnexion -->
              <button
                type="button"
                @click="logout"
                class="mt-5 inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-white/10 border border-white/15 text-white/90 font-semibold hover:bg-white/15 transition"
              >
                Se déconnecter
              </button>
            </div>

            <div class="flex items-center gap-3">
              <RouterLink
                to="/proposer_projet"
                class="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#CCFFBC] text-black font-bold hover:bg-[#E4FFD4] transition"
              >
                + Proposer un sujet
              </RouterLink>
            </div>
          </div>

          <!-- Stats -->
          <div class="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="bg-white/5 border border-white/10 rounded-3xl p-6">
              <p class="text-white/60 text-sm">Sujets proposés</p>
              <p class="text-3xl font-extrabold mt-1">{{ sujets.length }}</p>
            </div>

            <div class="bg-white/5 border border-white/10 rounded-3xl p-6">
              <p class="text-white/60 text-sm">Dernier dépôt</p>
              <p class="text-base font-semibold mt-1 text-white/80">
                {{ sujets[0]?.created ? new Date(sujets[0].created).toLocaleDateString() : "—" }}
              </p>
            </div>

            <div class="bg-white/5 border border-white/10 rounded-3xl p-6">
              <p class="text-white/60 text-sm">Type de compte</p>
              <p class="text-base font-semibold mt-1 text-white/80">
                {{ String(userType).toUpperCase() }}
              </p>
            </div>
          </div>

          <!-- Liste des sujets -->
          <div class="mt-14">
            <div class="flex items-center justify-between gap-4">
              <h2 class="text-4xl font-extrabold">Mes sujets</h2>
            </div>

            <p class="text-white/60 mt-2">
              Retrouvez ici tous les sujets que vous avez proposés.
            </p>

            <div class="mt-8">
              <div
                v-if="sujets.length"
                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <!-- ✅ CARTE CLIQUABLE => /sujets/:id -->
                <RouterLink
                  v-for="s in sujets"
                  :key="s.id"
                  :to="`/sujets/${s.id}`"
                  class="group relative rounded-3xl overflow-hidden bg-black/40 border border-white/10 shadow-xl hover:scale-[1.01] transition-transform"
                >
                  <!-- Image -->
                  <div class="h-44 w-full bg-white/5">
                    <img
                      v-if="imageMarqueUrl(s)"
                      :src="imageMarqueUrl(s)"
                      class="w-full h-full object-cover opacity-80 group-hover:opacity-95 transition"
                      alt="Image de marque"
                    />
                    <div
                      v-else
                      class="w-full h-full flex items-center justify-center text-white/35"
                    >
                      Pas d’image
                    </div>
                  </div>

                  <!-- Badges -->
                  <div class="absolute top-4 left-4 flex flex-wrap gap-2">
                    <span
                      class="text-xs font-semibold px-3 py-1 rounded-full bg-[#CCFFBC] text-black"
                    >
                      {{ anneeLabelText(s.annee) }}
                    </span>
                    <span
                      class="text-xs font-semibold px-3 py-1 rounded-full bg-[#CCFFBC] text-black"
                    >
                      {{ typeSujetLabel(s.type_sujet) }}
                    </span>
                  </div>

                  <!-- Contenu -->
                  <div class="p-5">
                    <h3 class="text-xl font-extrabold text-[#CCFFBC] line-clamp-2">
                      {{ s.titre || "(Sans titre)" }}
                    </h3>

                    <p class="text-white/70 text-sm mt-2 line-clamp-3">
                      {{ s.description || "—" }}
                    </p>

                    <!-- Compétences -->
                    <div class="mt-4 flex flex-wrap gap-2">
                      <span
                        v-for="c in (s.competences || []).slice(0, 4)"
                        :key="c"
                        class="text-[10px] px-2 py-1 rounded-full bg-white/10 border border-white/15 text-white/80"
                      >
                        {{ c === "W" ? "Web" : c }}
                      </span>
                      <span
                        v-if="(s.competences || []).length > 4"
                        class="text-[10px] px-2 py-1 rounded-full bg-white/10 border border-white/15 text-white/60"
                      >
                        +{{ (s.competences || []).length - 4 }}
                      </span>
                    </div>

                    <!-- Actions -->
                    <div class="mt-5 flex items-center justify-between gap-3">
                      <a
                        v-if="sujetPdfUrl(s)"
                        :href="sujetPdfUrl(s)"
                        target="_blank"
                        @click.stop
                        class="text-sm text-white/80 hover:text-white underline underline-offset-4"
                      >
                        Voir le PDF
                      </a>
                      <span v-else class="text-sm text-white/30">Pas de PDF</span>

                      <span class="text-xs text-white/40">
                        {{ s.created ? new Date(s.created).toLocaleDateString() : "" }}
                      </span>
                    </div>
                  </div>
                </RouterLink>
              </div>

              <div
                v-else
                class="mt-10 bg-white/5 border border-white/10 rounded-3xl p-10 text-center"
              >
                <p class="text-white/70 text-lg font-semibold">
                  Vous n’avez encore proposé aucun sujet.
                </p>
                <RouterLink
                  to="/proposer_projet"
                  class="inline-flex mt-6 px-6 py-3 rounded-full bg-[#CCFFBC] text-black font-bold hover:bg-[#B8E6A8] transition"
                >
                  Proposer mon premier sujet
                </RouterLink>
              </div>
            </div>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>
