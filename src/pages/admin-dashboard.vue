<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import AppHeader from "@/components/AppHeader.vue";
import { pb } from "@/pb";
import { ref, computed, onMounted } from "vue";
import { RouterLink, useRouter } from "vue-router";

const router = useRouter();

const loading = ref(true);
const error = ref("");

const user = ref(pb.authStore.model);
const sujets = ref([]);

// UI
const displayName = computed(() => user.value?.name || user.value?.username || "Admin");
const userType = computed(() =>
  String(user.value?.type_utilisateur || user.value?.type || user.value?.role || "").toLowerCase()
);

const isAdmin = computed(() => userType.value === "admin");

// ✅ Déconnexion
const logout = async () => {
  try {
    pb.authStore.clear();
    user.value = null;
    sujets.value = [];
    await router.push("/login"); // adapte si besoin
  } catch (e) {
    console.error(e);
    error.value = "Erreur lors de la déconnexion";
  }
};

// Helpers
const anneeLabelText = (annee) => {
  const a = String(annee);
  if (a === "1") return "1ère année";
  if (a === "2") return "2ème année";
  if (a === "3") return "3ème année";
  return a ? `${a}ème année` : "—";
};

const typeSujetLabel = (t) => {
  const v = String(t || "").toLowerCase();
  if (v === "solo") return "Solo";
  if (v === "collectif") return "Collectif";
  return t || "—";
};

const imageMarqueUrl = (s) => {
  if (!s?.image_marque) return null;
  try {
    return pb.files.getURL(s, s.image_marque);
  } catch {
    return null;
  }
};

const pendingCount = computed(() => sujets.value.length);

// Action admin
const updatingId = ref(null);
const updateError = ref("");

const verifySujet = async (s) => {
  if (!isAdmin.value || !s?.id) return;

  updatingId.value = s.id;
  updateError.value = "";

  try {
    await pb.collection("sujets").update(s.id, { verification: true });
    sujets.value = sujets.value.filter((x) => x.id !== s.id);
  } catch (e) {
    console.error(e);
    updateError.value =
      e?.data?.message || e?.message || "Impossible de valider ce sujet.";
  } finally {
    updatingId.value = null;
  }
};

onMounted(async () => {
  loading.value = true;
  error.value = "";

  try {
    if (!pb.authStore.isValid || !pb.authStore.model?.id) {
      throw new Error("Utilisateur non connecté");
    }

    user.value = await pb.collection("users").getOne(pb.authStore.model.id);

    if (!isAdmin.value) return;

    sujets.value = await pb.collection("sujets").getFullList({
      filter: "verification = false",
      sort: "-created",
      expand: "commanditaire",
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
        <!-- Accès restreint -->
        <div v-if="!isAdmin" class="min-h-[calc(100vh-140px)] flex items-center justify-center">
          <div
            class="max-w-xl w-full text-center bg-white/5 border border-white/10 rounded-3xl p-8 sm:p-10"
          >
            <h1 class="text-3xl font-extrabold mb-3">Accès restreint</h1>
            <p class="text-white/70">
              Vous n’avez pas les droits pour accéder au tableau de bord admin.
            </p>
            <RouterLink
              to="/"
              class="inline-flex mt-6 px-6 py-3 rounded-full bg-[#CCFFBC] text-black font-semibold hover:bg-[#B8E6A8] transition"
            >
              Retour à l’accueil
            </RouterLink>
          </div>
        </div>

        <!-- Dashboard admin -->
        <template v-else>
          <!-- Header -->
          <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight">
                Admin, <span class="text-[#CCFFBC]">{{ displayName }}</span>
              </h1>
              <p class="text-white/60 mt-2">
                Tableau de bord admin • Vérification des sujets
              </p>

              <button
                @click="logout"
                class="mt-5 inline-flex px-5 py-2.5 rounded-full bg-white/10 border border-white/15 text-white font-semibold hover:bg-white/15 transition"
              >
                Se déconnecter
              </button>
            </div>

            <RouterLink
              to="/sujets"
              class="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white/10 border border-white/15 text-white font-bold hover:bg-white/15 transition"
            >
              Voir tous les sujets
            </RouterLink>
          </div>

          <!-- Stats -->
          <div class="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="bg-white/5 border border-white/10 rounded-3xl p-6">
              <p class="text-white/60 text-sm">Sujets en attente</p>
              <p class="text-3xl font-extrabold mt-1">{{ pendingCount }}</p>
            </div>

            <div class="bg-white/5 border border-white/10 rounded-3xl p-6">
              <p class="text-white/60 text-sm">Rôle</p>
              <p class="text-base font-semibold mt-1 text-white/80">ADMIN</p>
            </div>

            <div class="bg-white/5 border border-white/10 rounded-3xl p-6">
              <p class="text-white/60 text-sm">Action</p>
              <p class="text-base font-semibold mt-1 text-white/80">
                Cocher = vérifier
              </p>
            </div>
          </div>

          <p v-if="updateError" class="mt-6 text-red-300 font-medium">
            {{ updateError }}
          </p>

          <!-- Liste -->
          <div class="mt-14">
            <h2 class="text-4xl font-extrabold">Sujets à vérifier</h2>

            <div class="mt-8">
              <div
                v-if="sujets.length"
                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <div
                  v-for="s in sujets"
                  :key="s.id"
                  class="relative rounded-3xl overflow-hidden bg-black/40 border border-white/10 shadow-xl"
                >
                  <div class="p-5">
                    <h3 class="text-xl font-extrabold text-[#CCFFBC]">
                      {{ s.titre || "(Sans titre)" }}
                    </h3>

                    <p class="text-white/70 text-sm mt-2">
                      {{ s.description || "—" }}
                    </p>

                    <label
                      class="mt-4 inline-flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        class="accent-[#CCFFBC] w-5 h-5"
                        :disabled="updatingId === s.id"
                        @change="verifySujet(s)"
                      />
                      <span class="text-sm font-semibold">
                        Vérifier
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div
                v-else
                class="mt-10 bg-white/5 border border-white/10 rounded-3xl p-10 text-center"
              >
                <p class="text-white/70 text-lg font-semibold">
                  Aucun sujet en attente 🎉
                </p>
                <RouterLink
                  to="/sujets"
                  class="inline-flex mt-6 px-6 py-3 rounded-full bg-[#CCFFBC] text-black font-bold hover:bg-[#B8E6A8] transition"
                >
                  Parcourir les sujets
                </RouterLink>
              </div>
            </div>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>
