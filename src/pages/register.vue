<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { pb } from "@/pb";
import { RouterLink } from "vue-router";
import MyLogo from "@/components/icons/MyLogo.vue";

const email = ref("");
const password = ref("");
const username = ref("");
const name = ref("");
const type = ref("etudiant");

// ✅ Promotions (records)
type PromoRecord = {
  id: string;
  parcours: string;
  annee: number | string;
  promo: string;
  presentable?: string;
};

const promotions = ref<PromoRecord[]>([]);
const promosLoading = ref(false);

// ✅ Choix en 3 étapes
const selectedPromo = ref<string>("");    // ex: "2023-2026"
const selectedAnnee = ref<string>("");    // "1" | "2" | "3"
const selectedParcours = ref<string>(""); // "dev" | "créa" | "com"

// ✅ Résultat final relationnel
const promotionId = ref<string>("");

const errorMsg = ref("");
const successMsg = ref("");

const isEtudiant = computed(() => type.value === "etudiant");

const parcoursLabel = (p: string) => {
  const v = String(p).toLowerCase();
  if (v === "dev") return "Développement";
  if (v === "créa" || v === "crea") return "Création / Design";
  if (v === "com") return "Communication";
  return p;
};

// ✅ Options uniques pour les dropdowns
const promoOptions = computed(() => {
  const set = new Set<string>();
  for (const pr of promotions.value) if (pr.promo) set.add(pr.promo);
  // tri décroissant si format "2023-2026" (string)
  return Array.from(set).sort((a, b) => b.localeCompare(a));
});

const anneeOptions = computed(() => {
  if (!selectedPromo.value) return [];
  const set = new Set<string>();
  for (const pr of promotions.value) {
    if (pr.promo !== selectedPromo.value) continue;
    set.add(String(pr.annee));
  }
  return Array.from(set).sort();
});

const parcoursOptions = computed(() => {
  if (!selectedPromo.value || !selectedAnnee.value) return [];
  const set = new Set<string>();
  for (const pr of promotions.value) {
    if (pr.promo !== selectedPromo.value) continue;
    if (String(pr.annee) !== selectedAnnee.value) continue;
    set.add(String(pr.parcours));
  }
  return Array.from(set).sort();
});

// ✅ Quand les 3 choix sont faits, on calcule l'ID promotion
const resolvePromotionId = () => {
  promotionId.value = "";
  if (!selectedPromo.value || !selectedAnnee.value || !selectedParcours.value) return;

  const match = promotions.value.find(
    (pr) =>
      pr.promo === selectedPromo.value &&
      String(pr.annee) === selectedAnnee.value &&
      String(pr.parcours) === selectedParcours.value
  );

  promotionId.value = match?.id || "";
};

// ✅ Reset quand on change un choix "en amont"
watch(selectedPromo, () => {
  selectedAnnee.value = "";
  selectedParcours.value = "";
  promotionId.value = "";
});

watch(selectedAnnee, () => {
  selectedParcours.value = "";
  promotionId.value = "";
});

// ✅ Recalcul quand on change le dernier choix
watch(selectedParcours, () => {
  resolvePromotionId();
});

// ✅ Si le user change type (etudiant -> prof), on reset la promo
watch(type, () => {
  if (type.value !== "etudiant") {
    selectedPromo.value = "";
    selectedAnnee.value = "";
    selectedParcours.value = "";
    promotionId.value = "";
  }
});

onMounted(async () => {
  promosLoading.value = true;
  try {
    promotions.value = await pb.collection("Promotion").getFullList<PromoRecord>({
      sort: "-promo,parcours,annee",
      fields: "id,parcours,annee,promo,presentable",
    });
  } catch (e) {
    console.error("Erreur chargement promotions:", e);
  } finally {
    promosLoading.value = false;
  }
});

async function register() {
  errorMsg.value = "";
  successMsg.value = "";

  // ✅ Si étudiant, promotion obligatoire
  if (isEtudiant.value) {
    if (!selectedPromo.value || !selectedAnnee.value || !selectedParcours.value) {
      errorMsg.value = "Veuillez sélectionner votre promo, votre année et votre parcours.";
      return;
    }
    if (!promotionId.value) {
      errorMsg.value = "Promotion introuvable (combinaison invalide).";
      return;
    }
  }

  try {
    const cleanUsername = username.value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9._-]/g, "");

    const payload: any = {
      email: email.value.trim(),
      password: password.value,
      passwordConfirm: password.value,
      username: cleanUsername,
      name: name.value.trim(),
      type_utilisateur: type.value,
    };

    if (isEtudiant.value) {
      payload.promotion = promotionId.value; // ✅ relation PB
    }

    await pb.collection("users").create(payload);

    successMsg.value = "Compte créé ! Vous pouvez maintenant vous connecter.";

    // reset
    email.value = "";
    password.value = "";
    username.value = "";
    name.value = "";
    type.value = "etudiant";
    selectedPromo.value = "";
    selectedAnnee.value = "";
    selectedParcours.value = "";
    promotionId.value = "";
  } catch (err) {
    const e = err as any;

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
        Rejoignez l’application de gestion des projets de MMI Montbéliard.
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

          <!-- ✅ 3 dropdowns uniquement si étudiant -->
          <div v-if="isEtudiant" class="space-y-3">
            <p class="text-sm text-white/70">Votre promotion *</p>

            <!-- Promo (ex 2023-2026) -->
            <select v-model="selectedPromo" class="input">
              <option value="" disabled>
                {{ promosLoading ? "Chargement..." : "Choisir votre promo (ex : 2023-2026)" }}
              </option>
              <option v-for="p in promoOptions" :key="p" :value="p">
                {{ p }}
              </option>
            </select>

            <!-- Année -->
            <select v-model="selectedAnnee" class="input" :disabled="!selectedPromo">
              <option value="" disabled>Choisir votre année</option>
              <option v-for="a in anneeOptions" :key="a" :value="a">
                {{ a }}ème année
              </option>
            </select>

            <!-- Parcours -->
            <select
              v-model="selectedParcours"
              class="input"
              :disabled="!selectedPromo || !selectedAnnee"
            >
              <option value="" disabled>Choisir votre parcours</option>
              <option v-for="p in parcoursOptions" :key="p" :value="p">
                {{ parcoursLabel(p) }}
              </option>
            </select>

            <!-- Petit feedback -->
            <p v-if="selectedPromo && selectedAnnee && selectedParcours && promotionId" class="text-xs text-[#CCFFBC]">
              ✅ Promotion sélectionnée
            </p>
            <p v-else class="text-xs text-white/50">
              Sélectionnez les 3 champs pour valider votre promotion.
            </p>
          </div>

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
  @apply focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed;
}
</style>
