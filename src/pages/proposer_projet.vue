<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import AppHeader from "@/components/AppHeader.vue";
import { pb } from "../pb";

const router = useRouter();

const loading = ref(false);
const error = ref("");
const success = ref(false);

// --- Form fields ---
const titre = ref("");
const annee = ref(""); // "1" | "2" | "3"
const typeSujet = ref(""); // "solo" | "collectif"
const description = ref("");
const objectifs = ref("");
const mail = ref("");

// compétences (select multiple)
const competencesOptions = ["SEO", "Design", "Développement", "W"];
const competences = ref([]); // array of selected strings

// files
const imageMarqueFile = ref(null); // File
const sujetPdfFile = ref(null); // File

// utilisateur connecté
const authUser = computed(() => pb.authStore?.record || null);

// helpers
const onPickImageMarque = (e) => {
  const f = e.target.files?.[0] || null;
  imageMarqueFile.value = f;
};

const onPickSujetPdf = (e) => {
  const f = e.target.files?.[0] || null;
  sujetPdfFile.value = f;
};

const toggleCompetence = (c) => {
  if (competences.value.includes(c)) {
    competences.value = competences.value.filter((x) => x !== c);
  } else {
    competences.value = [...competences.value, c];
  }
};

const resetForm = () => {
  titre.value = "";
  annee.value = "";
  typeSujet.value = "";
  description.value = "";
  objectifs.value = "";
  mail.value = "";
  competences.value = [];
  imageMarqueFile.value = null;
  sujetPdfFile.value = null;
  success.value = false;
  error.value = "";
};

// submit
const submit = async () => {
  error.value = "";
  success.value = false;

  if (!titre.value.trim()) return (error.value = "Le titre est obligatoire.");
  if (!annee.value) return (error.value = "Veuillez sélectionner une année.");
  if (!typeSujet.value) return (error.value = "Veuillez sélectionner solo / collectif.");
  if (!description.value.trim()) return (error.value = "La description est obligatoire.");
  if (!objectifs.value.trim()) return (error.value = "Les objectifs sont obligatoires.");
  if (!mail.value.trim()) return (error.value = "L'email est obligatoire.");

  loading.value = true;

  try {
    const formData = new FormData();

    formData.append("titre", titre.value.trim());
    formData.append("annee", String(annee.value)); // select single
    formData.append("type_sujet", typeSujet.value); // solo/collectif
    formData.append("description", description.value.trim());
    formData.append("objectifs", objectifs.value.trim());
    formData.append("mail", mail.value.trim());

    // ✅ select multiple: append multiple times (souvent le plus safe)
    (competences.value || []).forEach((c) => {
      formData.append("competences", c);
    });

    // ✅ relation commanditaire : seulement si user connecté + autorisé
    // adapte le champ selon ton users: "role" ou "type_utilisateur"
    const u = pb.authStore?.record;
    const userRole = u?.role || u?.type_utilisateur; // adapte si besoin

    const isAllowedCommanditaire = userRole === "admin" || userRole === "enseignant";
    if (u?.id && isAllowedCommanditaire) {
      formData.append("commanditaire", u.id);
    }

    // ✅ fichiers
    if (imageMarqueFile.value instanceof File) {
      formData.append("image_marque", imageMarqueFile.value);
    }
    if (sujetPdfFile.value instanceof File) {
      formData.append("sujet_pdf", sujetPdfFile.value);
    }

    await pb.collection("sujets").create(formData);

    success.value = true;
    resetForm();
    success.value = true;
  } catch (e) {
    console.error("PocketBase error FULL:", e);
    console.error("PocketBase error data:", e?.data);
    error.value =
      e?.data?.message ||
      JSON.stringify(e?.data, null, 2) ||
      e?.message ||
      "Erreur lors de l’envoi.";
  } finally {
    loading.value = false;
  }
};

</script>

<template>
  <div class="min-h-screen bg-[#0E1116] text-white">
    <AppHeader />

    <div class="px-6 py-10 max-w-3xl">
      <!-- Titre -->
      <h1 class="text-3xl font-bold mb-2">Proposer un projet</h1>
      <p class="text-gray-300 max-w-xl mb-10">
        Proposez vos projets ici, votre proposition sera examinée par un administrateur et
        ajoutée à la liste des sujets s’il correspond aux attendus de MMI.
      </p>

      <!-- Infos connexion -->
      <p v-if="authUser" class="text-white/70 mb-6">
        Connecté en tant que <span class="text-[#CCFFBC] font-semibold">{{ authUser.name || authUser.username }}</span>
      </p>
      <p v-else class="text-yellow-300/90 mb-6">
        Vous n’êtes pas connecté : le champ “commanditaire” ne sera pas rempli.
      </p>

      <!-- Alerts -->
      <p v-if="error" class="mb-6 text-red-300 font-medium">{{ error }}</p>
      <p v-if="success" class="mb-6 text-[#CCFFBC] font-medium">✅ Proposition envoyée !</p>

      <!-- Form -->
      <form class="space-y-8" @submit.prevent="submit">
        <!-- Nom du projet -->
        <div>
          <label class="block mb-2">Nom du projet*</label>
          <input
            v-model="titre"
            type="text"
            class="w-full bg-transparent border border-gray-400 rounded-md px-3 py-2 outline-none focus:border-[#CCFFBC]"
          />
        </div>

        <!-- Année -->
        <div>
          <label class="block mb-2">Année cible (BUT)*</label>
          <select
            v-model="annee"
            class="w-full bg-transparent border border-gray-400 rounded-md px-3 py-2 outline-none focus:border-[#CCFFBC]"
          >
            <option value="" disabled>Choisir une année</option>
            <option value="1">1ère année</option>
            <option value="2">2ème année</option>
            <option value="3">3ème année</option>
          </select>
        </div>

        <!-- Type sujet -->
        <div>
          <label class="block mb-2">Type de sujet*</label>
          <div class="flex gap-3">
            <button
              type="button"
              @click="typeSujet = 'solo'"
              class="px-4 py-2 rounded-full border transition"
              :class="typeSujet === 'solo'
                ? 'bg-[#CCFFBC] text-black border-[#CCFFBC]'
                : 'border-gray-400 text-white/80 hover:border-white/70'"
            >
              Solo
            </button>
            <button
              type="button"
              @click="typeSujet = 'collectif'"
              class="px-4 py-2 rounded-full border transition"
              :class="typeSujet === 'collectif'
                ? 'bg-[#CCFFBC] text-black border-[#CCFFBC]'
                : 'border-gray-400 text-white/80 hover:border-white/70'"
            >
              Collectif
            </button>
          </div>
        </div>

        <!-- Description -->
        <div>
          <label class="block mb-2">Description du projet*</label>
          <textarea
            v-model="description"
            rows="4"
            class="w-full bg-transparent border border-gray-400 rounded-md px-3 py-2 outline-none focus:border-[#CCFFBC]"
          />
        </div>

        <!-- Objectifs -->
        <div>
          <label class="block mb-2">Objectifs du projet*</label>
          <textarea
            v-model="objectifs"
            rows="3"
            class="w-full bg-transparent border border-gray-400 rounded-md px-3 py-2 outline-none focus:border-[#CCFFBC]"
          />
        </div>

        <!-- Compétences -->
        <div>
          <label class="block mb-3">Compétences mobilisées</label>

          <div class="flex flex-wrap gap-3">
            <button
              v-for="c in competencesOptions"
              :key="c"
              type="button"
              @click="toggleCompetence(c)"
              class="px-4 py-2 rounded-full border transition"
              :class="competences.includes(c)
                ? 'bg-[#CCFFBC] text-black border-[#CCFFBC]'
                : 'border-gray-500 text-white/80 hover:border-white/70'"
            >
              {{ c }}
            </button>
          </div>

          <p class="text-white/50 text-sm mt-2">
            Sélection multiple autorisée.
          </p>
        </div>

        <!-- Documents -->
        <div>
          <label class="block mb-3">Documents et liens utiles</label>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mb-3">
            <!-- Image de marque -->
            <label class="bg-[#2A2C32] p-4 rounded-md flex flex-col items-center gap-2 border border-gray-500 cursor-pointer hover:border-white/60 transition">
              <div class="w-10 h-10 rounded bg-[#CCFFBC]/30 flex items-center justify-center">
                📷
              </div>
              <span class="text-sm">Image de marque</span>
              <span class="text-xs text-white/60">
                {{ imageMarqueFile ? imageMarqueFile.name : "Aucun fichier" }}
              </span>
              <input type="file" accept="image/*" class="hidden" @change="onPickImageMarque" />
            </label>

            <!-- Sujet PDF -->
            <label class="bg-[#2A2C32] p-4 rounded-md flex flex-col items-center gap-2 border border-gray-500 cursor-pointer hover:border-white/60 transition">
              <div class="w-10 h-10 rounded bg-[#CCFFBC]/30 flex items-center justify-center">
                📄
              </div>
              <span class="text-sm">Sujet (PDF)</span>
              <span class="text-xs text-white/60">
                {{ sujetPdfFile ? sujetPdfFile.name : "Aucun fichier" }}
              </span>
              <input type="file" accept="application/pdf" class="hidden" @change="onPickSujetPdf" />
            </label>
          </div>
        </div>

        <!-- Email -->
        <div>
          <label class="block mb-2">Adresse email*</label>
          <input
            v-model="mail"
            type="email"
            class="w-full bg-transparent border border-gray-400 rounded-md px-3 py-2 outline-none focus:border-[#CCFFBC]"
          />
        </div>

        <!-- Submit -->
        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-[#CCFFBC] text-black py-3 rounded-full hover:bg-[#B8E6A8] transition font-medium disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {{ loading ? "Envoi..." : "Envoyer la proposition" }}
        </button>
      </form>
    </div>
  </div>
</template>
