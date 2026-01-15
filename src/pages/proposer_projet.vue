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
const annee = ref("");
const typeSujet = ref("");
const description = ref("");
const objectifs = ref("");
const mail = ref("");

// nom externe (entreprise / étudiant / personne externe)
const nomExterne = ref("");

// compétences
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

// ✅ refs pour reset les inputs file (sinon parfois on ne peut pas re-choisir le même fichier)
const imageInputRef = ref(null);
const pdfInputRef = ref(null);

// auth
const authUser = computed(() => pb.authStore?.record || null);
const isLoggedIn = computed(() => !!authUser.value?.id);

// helpers
const onPickImageMarque = (e) => {
  imageMarqueFile.value = e.target.files?.[0] || null;
};

const onPickSujetPdf = (e) => {
  sujetPdfFile.value = e.target.files?.[0] || null;
};

const toggleCompetence = (c) => {
  competences.value = competences.value.includes(c)
    ? competences.value.filter((x) => x !== c)
    : [...competences.value, c];
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

  // ✅ reset des champs file
  if (imageInputRef.value) imageInputRef.value.value = "";
  if (pdfInputRef.value) pdfInputRef.value.value = "";
};

const submit = async () => {
  error.value = "";
  success.value = false;

  if (!titre.value.trim()) return (error.value = "Le titre est obligatoire.");
  if (!annee.value) return (error.value = "Veuillez sélectionner une année.");
  if (!typeSujet.value) return (error.value = "Veuillez sélectionner solo ou collectif.");
  if (!description.value.trim()) return (error.value = "La description est obligatoire.");
  if (!objectifs.value.trim()) return (error.value = "Les objectifs sont obligatoires.");
  if (!mail.value.trim()) return (error.value = "L'email est obligatoire.");
  if (!isLoggedIn.value && !nomExterne.value.trim())
    return (error.value = "Veuillez indiquer votre nom (étudiant/entreprise).");

  loading.value = true;

  try {
    const user = pb.authStore?.record;

    const payload = {
      titre: titre.value.trim(),
      annee: String(annee.value),
      type_sujet: typeSujet.value,
      description: description.value.trim(),
      objectifs: objectifs.value.trim(),
      mail: mail.value.trim(),

      // ✅ IMPORTANT: tableau direct pour select multiple
      competences: competences.value || [],

      // ✅ nom_externe toujours rempli
      nom_externe: (nomExterne.value.trim() || user?.name || user?.username || "").trim(),

      // ✅ relation seulement si connecté
      ...(user?.id ? { commanditaire: user.id } : {}),

      // ✅ fichiers
      ...(imageMarqueFile.value ? { image_marque: imageMarqueFile.value } : {}),
      ...(sujetPdfFile.value ? { sujet_pdf: sujetPdfFile.value } : {}),
    };

    await pb.collection("sujets").create(payload);

    success.value = true;
    resetForm();
  } catch (e) {
    console.error("PB error:", e?.data || e);
    const fieldErrors = e?.data?.data ? JSON.stringify(e.data.data, null, 2) : "";
    error.value =
      (e?.data?.message || "Erreur PocketBase.") +
      (fieldErrors ? `\n\nDétails:\n${fieldErrors}` : "");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-[#151A24] text-white">
    <AppHeader />

    <div class="px-4 sm:px-6 py-10">
      <div class="max-w-4xl mx-auto">
        <div class="bg-white/5 border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-10">
          <!-- Header -->
          <div class="text-center">
            <h1 class="text-3xl sm:text-4xl font-extrabold mb-3">
              Proposer un projet
            </h1>

            <p class="text-white/70 max-w-2xl mx-auto">
              Étudiants, entreprises ou porteurs de projets : vous pouvez proposer un sujet de projet MMI.
              Chaque proposition est examinée par l’équipe pédagogique avant validation.
            </p>

            <p v-if="authUser" class="text-white/60 mt-6">
              Connecté en tant que
              <span class="text-[#CCFFBC] font-semibold">
                {{ authUser.name || authUser.username }}
              </span>
            </p>

            <p v-else class="text-white/50 mt-6 text-sm">
              Vous pouvez proposer un sujet sans compte. Indiquez simplement votre nom.
            </p>
          </div>

          <!-- Alerts -->
          <div class="mt-8">
            <p v-if="error" class="mb-4 text-red-300 font-medium text-center">
              {{ error }}
            </p>
            <p v-if="success" class="mb-4 text-[#CCFFBC] font-medium text-center">
              ✅ Proposition envoyée avec succès !
            </p>
          </div>

          <!-- Form -->
          <form class="mt-6 space-y-7" @submit.prevent="submit">
            <!-- Nom externe -->
            <div v-if="!isLoggedIn">
              <label class="block mb-2 text-white/80">
                Nom (étudiant / entreprise)*
              </label>
              <input
                v-model="nomExterne"
                type="text"
                placeholder="Ex : Jean Dupont – BUT MMI"
                class="w-full bg-[#151A24]/60 border border-white/15 rounded-xl px-4 py-3 outline-none focus:border-[#CCFFBC] transition"
              />
            </div>

            <!-- Projet + année -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block mb-2 text-white/80">Nom du projet*</label>
                <input
                  v-model="titre"
                  type="text"
                  class="w-full bg-[#151A24]/60 border border-white/15 rounded-xl px-4 py-3 outline-none focus:border-[#CCFFBC]"
                />
              </div>

              <div>
                <label class="block mb-2 text-white/80">Année cible*</label>
                <select
                  v-model="annee"
                  class="w-full bg-[#151A24]/60 border border-white/15 rounded-xl px-4 py-3 outline-none focus:border-[#CCFFBC]"
                >
                  <option value="" disabled>Choisir une année</option>
                  <option value="1">BUT 1</option>
                  <option value="2">BUT 2</option>
                  <option value="3">BUT 3</option>
                </select>
              </div>
            </div>

            <!-- Type -->
            <div>
              <label class="block mb-3 text-white/80">Type de projet*</label>
              <div class="flex gap-3">
                <button
                  type="button"
                  @click="typeSujet = 'solo'"
                  :class="typeSujet === 'solo'
                    ? 'bg-[#CCFFBC] text-black'
                    : 'border-white/20 text-white/80'"
                  class="px-5 py-3 rounded-full border transition"
                >
                  Solo
                </button>
                <button
                  type="button"
                  @click="typeSujet = 'collectif'"
                  :class="typeSujet === 'collectif'
                    ? 'bg-[#CCFFBC] text-black'
                    : 'border-white/20 text-white/80'"
                  class="px-5 py-3 rounded-full border transition"
                >
                  Collectif
                </button>
              </div>
            </div>

            <!-- Description -->
            <div>
              <label class="block mb-2 text-white/80">Description*</label>
              <textarea
                v-model="description"
                rows="5"
                class="w-full bg-[#151A24]/60 border border-white/15 rounded-xl px-4 py-3"
              />
            </div>

            <!-- Objectifs -->
            <div>
              <label class="block mb-2 text-white/80">Objectifs*</label>
              <textarea
                v-model="objectifs"
                rows="4"
                class="w-full bg-[#151A24]/60 border border-white/15 rounded-xl px-4 py-3"
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
                  :class="competences.includes(c)
                    ? 'bg-[#CCFFBC] text-black'
                    : 'border-white/20 text-white/80'"
                  class="px-4 py-2 rounded-full border transition text-sm"
                >
                  {{ c }}
                </button>
              </div>
              <p class="text-white/50 text-sm mt-2">Sélection multiple autorisée.</p>
            </div>

            <!-- ✅ Documents -->
            <div>
              <label class="block mb-3 text-white/80">Documents</label>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- Image de marque -->
                <label
                  class="bg-[#151A24]/60 p-5 rounded-2xl flex flex-col items-center gap-2 border border-white/15 cursor-pointer hover:border-white/40 transition"
                >
                  <div class="w-11 h-11 rounded-xl bg-[#CCFFBC]/20 flex items-center justify-center">
                    📷
                  </div>
                  <span class="text-sm text-white/80">Image de marque</span>
                  <span class="text-xs text-white/60">
                    {{ imageMarqueFile ? imageMarqueFile.name : "Aucun fichier" }}
                  </span>

                  <input
                    ref="imageInputRef"
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="onPickImageMarque"
                  />
                </label>

                <!-- Sujet PDF -->
                <label
                  class="bg-[#151A24]/60 p-5 rounded-2xl flex flex-col items-center gap-2 border border-white/15 cursor-pointer hover:border-white/40 transition"
                >
                  <div class="w-11 h-11 rounded-xl bg-[#CCFFBC]/20 flex items-center justify-center">
                    📄
                  </div>
                  <span class="text-sm text-white/80">Sujet (PDF)</span>
                  <span class="text-xs text-white/60">
                    {{ sujetPdfFile ? sujetPdfFile.name : "Aucun fichier" }}
                  </span>

                  <input
                    ref="pdfInputRef"
                    type="file"
                    accept="application/pdf"
                    class="hidden"
                    @change="onPickSujetPdf"
                  />
                </label>
              </div>

              <p class="text-white/50 text-sm mt-2">
                Optionnel : ajoutez une image (logo/visuel) et/ou un PDF pour préciser le besoin.
              </p>
            </div>

            <!-- Email -->
            <div>
              <label class="block mb-2 text-white/80">Email*</label>
              <input
                v-model="mail"
                type="email"
                class="w-full bg-[#151A24]/60 border border-white/15 rounded-xl px-4 py-3"
              />
            </div>

            <!-- Submit -->
            <button
              type="submit"
              :disabled="loading"
              class="w-full bg-[#CCFFBC] text-black py-3.5 rounded-full font-semibold hover:bg-[#B8E6A8] disabled:opacity-60"
            >
              {{ loading ? "Envoi en cours..." : "Envoyer le projet" }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
