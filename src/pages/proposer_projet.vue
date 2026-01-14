<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ref, computed } from "vue";
import AppHeader from "@/components/AppHeader.vue";
import { pb } from "../pb";

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

// ✅ nouveau : nom externe (entreprise/personne non inscrite)
const nomExterne = ref("");

// compétences (select multiple)
const competencesOptions = [
  "SEO",
  "Design",
  "Développement",
  "Wordpress",
  "Photoshop",
  "Figma",
  "Montage vidéo",
  "Unreal Engine",
  "Marketing",
  "Réseaux sociaux",
  "Gestion de projet",
];

const competences = ref([]);

// files
const imageMarqueFile = ref(null);
const sujetPdfFile = ref(null);

// utilisateur connecté (optionnel)
const authUser = computed(() => pb.authStore?.record || null);
const isLoggedIn = computed(() => !!authUser.value?.id);

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
  nomExterne.value = "";
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

  // 🔒 validations
  if (!titre.value.trim()) return (error.value = "Le titre est obligatoire.");
  if (!annee.value) return (error.value = "Veuillez sélectionner une année.");
  if (!typeSujet.value) return (error.value = "Veuillez sélectionner solo ou collectif.");
  if (!description.value.trim()) return (error.value = "La description est obligatoire.");
  if (!objectifs.value.trim()) return (error.value = "Les objectifs sont obligatoires.");
  if (!mail.value.trim()) return (error.value = "L'email est obligatoire.");

  // ✅ si pas connecté : on exige le nom externe
  if (!isLoggedIn.value && !nomExterne.value.trim()) {
    return (error.value = "Veuillez indiquer votre nom / entreprise (nom externe).");
  }

  loading.value = true;

  try {
    const formData = new FormData();

    formData.append("titre", titre.value.trim());
    formData.append("annee", String(annee.value));
    formData.append("type_sujet", typeSujet.value);
    formData.append("description", description.value.trim());
    formData.append("objectifs", objectifs.value.trim());
    formData.append("mail", mail.value.trim());

    (competences.value || []).forEach((c) => {
      formData.append("competences", c);
    });

    // ✅ si connecté : on garde le lien "commanditaire"
    const user = pb.authStore?.record;
    if (user?.id) {
      formData.append("commanditaire", user.id);

      // optionnel : si tu veux aussi remplir nom_externe automatiquement avec le nom du compte
      // (tu peux supprimer ces 2 lignes si tu veux laisser vide côté connecté)
      if (!nomExterne.value.trim()) {
        formData.append("nom_externe", (user.name || user.username || "").trim());
      } else {
        formData.append("nom_externe", nomExterne.value.trim());
      }
    } else {
      // ✅ pas connecté : uniquement nom_externe
      formData.append("nom_externe", nomExterne.value.trim());
    }

    if (imageMarqueFile.value instanceof File) {
      formData.append("image_marque", imageMarqueFile.value);
    }
    if (sujetPdfFile.value instanceof File) {
      formData.append("sujet_pdf", sujetPdfFile.value);
    }

    await pb.collection("sujets").create(formData);

    success.value = true;
    resetForm();
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
  <div class="min-h-screen bg-[#151A24] text-white">
    <AppHeader />

    <!-- ✅ FORMULAIRE OUVERT À TOUS -->
    <div class="px-4 sm:px-6 py-10">
      <!-- wrapper centré -->
      <div class="max-w-4xl mx-auto">
        <!-- card -->
        <div class="bg-white/5 border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-10">
          <!-- Header -->
          <div class="text-center">
            <h1 class="text-3xl sm:text-4xl font-extrabold mb-3">Proposer un projet</h1>
            <p class="text-white/70 max-w-2xl mx-auto">
              Proposez un sujet de projet. Il sera examiné par un administrateur et ajouté à la liste des sujets s’il
              correspond aux attendus de MMI.
            </p>

            <p v-if="authUser" class="text-white/60 mt-6">
              Connecté en tant que
              <span class="text-[#CCFFBC] font-semibold">{{ authUser.name || authUser.username }}</span>
            </p>
            <p v-else class="text-white/50 mt-6 text-sm">
              Vous pouvez proposer un sujet sans compte. Indiquez simplement votre nom / entreprise.
            </p>
          </div>

          <!-- Alerts -->
          <div class="mt-8">
            <p v-if="error" class="mb-4 text-red-300 font-medium text-center">{{ error }}</p>
            <p v-if="success" class="mb-4 text-[#CCFFBC] font-medium text-center">✅ Proposition envoyée !</p>
          </div>

          <!-- Form -->
          <form class="mt-6 space-y-7" @submit.prevent="submit">
            <!-- ✅ Nom externe (affiché si pas connecté, mais tu peux le laisser visible aussi) -->
            <div v-if="!isLoggedIn">
              <label class="block mb-2 text-white/80">Nom / Entreprise*</label>
              <input
                v-model="nomExterne"
                type="text"
                placeholder="Ex: Entreprise ABC / Jean Dupont"
                class="w-full bg-[#151A24]/60 border border-white/15 rounded-xl px-4 py-3 outline-none focus:border-[#CCFFBC] transition"
              />
              <p class="text-white/50 text-sm mt-2">
                Ce champ remplace l’identification par compte lorsqu’on n’est pas connecté.
              </p>
            </div>

            <!-- Ligne 2 colonnes sur desktop -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Nom du projet -->
              <div>
                <label class="block mb-2 text-white/80">Nom du projet*</label>
                <input
                  v-model="titre"
                  type="text"
                  class="w-full bg-[#151A24]/60 border border-white/15 rounded-xl px-4 py-3 outline-none focus:border-[#CCFFBC] transition"
                />
              </div>

              <!-- Année -->
              <div>
                <label class="block mb-2 text-white/80">Année cible (BUT)*</label>
                <select
                  v-model="annee"
                  class="w-full bg-[#151A24]/60 border border-white/15 rounded-xl px-4 py-3 outline-none focus:border-[#CCFFBC] transition"
                >
                  <option value="" disabled>Choisir une année</option>
                  <option value="1">1ère année</option>
                  <option value="2">2ème année</option>
                  <option value="3">3ème année</option>
                </select>
              </div>
            </div>

            <!-- Type sujet -->
            <div>
              <label class="block mb-3 text-white/80">Type de sujet*</label>
              <div class="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  @click="typeSujet = 'solo'"
                  class="px-5 py-3 rounded-full border transition font-medium"
                  :class="typeSujet === 'solo'
                    ? 'bg-[#CCFFBC] text-black border-[#CCFFBC]'
                    : 'border-white/20 text-white/80 hover:border-white/50'"
                >
                  Solo
                </button>
                <button
                  type="button"
                  @click="typeSujet = 'collectif'"
                  class="px-5 py-3 rounded-full border transition font-medium"
                  :class="typeSujet === 'collectif'
                    ? 'bg-[#CCFFBC] text-black border-[#CCFFBC]'
                    : 'border-white/20 text-white/80 hover:border-white/50'"
                >
                  Collectif
                </button>
              </div>
            </div>

            <!-- Description -->
            <div>
              <label class="block mb-2 text-white/80">Description du projet*</label>
              <textarea
                v-model="description"
                rows="5"
                class="w-full bg-[#151A24]/60 border border-white/15 rounded-xl px-4 py-3 outline-none focus:border-[#CCFFBC] transition"
              />
            </div>

            <!-- Objectifs -->
            <div>
              <label class="block mb-2 text-white/80">Objectifs du projet*</label>
              <textarea
                v-model="objectifs"
                rows="4"
                class="w-full bg-[#151A24]/60 border border-white/15 rounded-xl px-4 py-3 outline-none focus:border-[#CCFFBC] transition"
              />
            </div>

            <!-- Compétences -->
            <div>
              <label class="block mb-3 text-white/80">Compétences mobilisées</label>
              <div class="flex flex-wrap gap-3">
                <button
                  v-for="c in competencesOptions"
                  :key="c"
                  type="button"
                  @click="toggleCompetence(c)"
                  class="px-4 py-2 rounded-full border transition text-sm"
                  :class="competences.includes(c)
                    ? 'bg-[#CCFFBC] text-black border-[#CCFFBC]'
                    : 'border-white/20 text-white/80 hover:border-white/50'"
                >
                  {{ c }}
                </button>
              </div>
              <p class="text-white/50 text-sm mt-2">Sélection multiple autorisée.</p>
            </div>

            <!-- Documents -->
            <div>
              <label class="block mb-3 text-white/80">Documents et liens utiles</label>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- Image de marque -->
                <label
                  class="bg-[#151A24]/60 p-5 rounded-2xl flex flex-col items-center gap-2 border border-white/15 cursor-pointer hover:border-white/40 transition"
                >
                  <div class="w-11 h-11 rounded-xl bg-[#CCFFBC]/20 flex items-center justify-center">📷</div>
                  <span class="text-sm text-white/80">Image de marque</span>
                  <span class="text-xs text-white/60">
                    {{ imageMarqueFile ? imageMarqueFile.name : "Aucun fichier" }}
                  </span>
                  <input type="file" accept="image/*" class="hidden" @change="onPickImageMarque" />
                </label>

                <!-- Sujet PDF -->
                <label
                  class="bg-[#151A24]/60 p-5 rounded-2xl flex flex-col items-center gap-2 border border-white/15 cursor-pointer hover:border-white/40 transition"
                >
                  <div class="w-11 h-11 rounded-xl bg-[#CCFFBC]/20 flex items-center justify-center">📄</div>
                  <span class="text-sm text-white/80">Sujet (PDF)</span>
                  <span class="text-xs text-white/60">
                    {{ sujetPdfFile ? sujetPdfFile.name : "Aucun fichier" }}
                  </span>
                  <input type="file" accept="application/pdf" class="hidden" @change="onPickSujetPdf" />
                </label>
              </div>
            </div>

            <!-- Email -->
            <div>
              <label class="block mb-2 text-white/80">Adresse email*</label>
              <input
                v-model="mail"
                type="email"
                class="w-full bg-[#151A24]/60 border border-white/15 rounded-xl px-4 py-3 outline-none focus:border-[#CCFFBC] transition"
              />
            </div>

            <!-- Submit -->
            <button
              type="submit"
              :disabled="loading"
              class="w-full bg-[#CCFFBC] text-black py-3.5 rounded-full hover:bg-[#B8E6A8] transition font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {{ loading ? "Envoi..." : "Envoyer la proposition" }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
