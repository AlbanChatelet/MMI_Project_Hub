<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import AppHeader from "@/components/AppHeader.vue";
import { pb } from "@/pb";

/* ===========================
   ROUTE / STATE
   =========================== */
const route = useRoute();
const id = computed(() => String(route.params.id || ""));

const loading = ref(true);
const error = ref("");

const projet = ref(null);
const sujet = ref(null);
const groupe = ref(null);
const membres = ref([]);
const etapes = ref([]);

/* ===========================
   AUTH / DROITS
   =========================== */
const authUser = computed(() => pb.authStore.model || null);
const authUserId = computed(() => authUser.value?.id || null);

const isMemberOfGroup = computed(() => {
  if (!authUserId.value) return false;
  return Array.isArray(groupe.value?.membres)
    ? groupe.value.membres.includes(authUserId.value)
    : false;
});

const canEdit = computed(() => isMemberOfGroup.value);

/* ===========================
   HELPERS
   =========================== */
const userDisplayName = (u) =>
  `${u?.prenom || ""} ${u?.nom || ""}`.trim() ||
  u?.username ||
  u?.email ||
  "Utilisateur";

const initials = (name) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const userAvatarUrl = (u) => {
  const file = u?.avatar || u?.photo || u?.image;
  return file ? pb.files.getUrl(u, file) : null;
};

const heroImageUrl = computed(() => {
  if (projet.value?.photo) return pb.files.getUrl(projet.value, projet.value.photo);
  if (sujet.value?.image_marque)
    return pb.files.getUrl(sujet.value, sujet.value.image_marque);
  return null;
});

const assignedMembers = (e) => {
  if (Array.isArray(e?.expand?.membres) && e.expand.membres.length)
    return e.expand.membres;

  const ids = e?.membres || [];
  return membres.value.filter((u) => ids.includes(u.id));
};

/* ===========================
   ÉTAPES
   =========================== */
const showAddEtape = ref(false);
const creatingEtape = ref(false);

const etapeForm = ref({
  titre: "",
  description: "",
  date_debut: "",
  date_fin: "",
  statut: "todo",
  progress: 0,
  membres: [],
});

const reloadEtapes = async () => {
  etapes.value = await pb.collection("Etape").getFullList({
    filter: `id_projet="${id.value}"`,
    expand: "membres",
    sort: "date_debut",
  });
};

const createEtape = async () => {
  if (!canEdit.value) return;

  creatingEtape.value = true;
  try {
    await pb.collection("Etape").create({
      ...etapeForm.value,
      id_projet: projet.value.id,
    });
    await reloadEtapes();
    showAddEtape.value = false;
    etapeForm.value = {
      titre: "",
      description: "",
      date_debut: "",
      date_fin: "",
      statut: "todo",
      progress: 0,
      membres: [],
    };
  } finally {
    creatingEtape.value = false;
  }
};

/* ===========================
   DOCUMENTS (UI ONLY)
   =========================== */
const showAddDocument = ref(false);
const documentTab = ref("document"); // document | lien

/* ===========================
   MOUNTED
   =========================== */
onMounted(async () => {
  try {
    projet.value = await pb.collection("Projet").getOne(id.value, {
      expand: "sujet",
    });
    sujet.value = projet.value.expand?.sujet || null;

    if (projet.value.groupe) {
      groupe.value = await pb.collection("Groupe").getOne(projet.value.groupe);

      if (groupe.value.membres?.length) {
        membres.value = await pb.collection("users").getFullList({
          filter: groupe.value.membres.map((m) => `id="${m}"`).join(" || "),
        });
      }
    }

    await reloadEtapes();
  } catch (e) {
    error.value = e.message || "Erreur de chargement";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="min-h-screen bg-[#151A24] text-white">
    <AppHeader variant="transparent" />

    <div v-if="loading" class="p-10 text-white/60">Chargement…</div>
    <div v-else-if="error" class="p-10 text-red-400">{{ error }}</div>

    <template v-else>
      <!-- HERO -->
      <section class="relative h-[420px]">
        <img
          v-if="heroImageUrl"
          :src="heroImageUrl"
          class="absolute inset-0 w-full h-full object-cover"
        />
        <div class="absolute inset-0 bg-black/60" />

        <div class="relative max-w-6xl mx-auto px-6 pt-40">
          <h1 class="text-5xl font-extrabold text-[#CFFFBC]">
            {{ projet.titre }}
          </h1>

          <span
            class="inline-block mt-4 px-3 py-1 rounded-full text-sm font-semibold"
            :class="canEdit ? 'bg-[#CFFFBC]/20 text-[#CFFFBC]' : 'bg-white/10 text-white/70'"
          >
            {{ canEdit ? "Vous pouvez modifier ce projet" : "Lecture seule" }}
          </span>
        </div>
      </section>

      <!-- CONTENU -->
      <section class="max-w-6xl mx-auto px-6 py-14 space-y-14">

        <!-- DOCUMENTS -->
        <section>
          <h2 class="text-xl font-extrabold mb-4">Liens et documents</h2>

          <div class="flex gap-4">
            <div class="w-40 h-40 rounded-xl bg-white/5 grid place-items-center">
              📄 Maquette
            </div>
            <div class="w-40 h-40 rounded-xl bg-white/5 grid place-items-center">
              📁 Arbo
            </div>
            <div class="w-40 h-40 rounded-xl bg-white/5 grid place-items-center">
              🔗 Drive
            </div>
          </div>

          <button
            v-if="canEdit"
            class="mt-4 w-full py-3 rounded-xl border border-white/20 text-white/70 hover:bg-white/10"
            @click="showAddDocument = true"
          >
            + Ajouter un document
          </button>
        </section>

        <!-- TO DO LIST -->
        <section>
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-extrabold">To do list</h2>
            <button
              v-if="canEdit"
              class="px-4 py-2 rounded-full bg-[#CFFFBC]/20 text-[#CFFFBC]"
              @click="showAddEtape = true"
            >
              + Ajouter une étape
            </button>
          </div>

          <div class="flex gap-4 overflow-x-auto">
            <article
              v-for="e in etapes"
              :key="e.id"
              class="min-w-[320px] bg-[#2B3140] rounded-2xl p-5"
            >
              <h3 class="text-lg font-bold text-[#CFFFBC]">{{ e.titre }}</h3>

              <div class="flex gap-2 mt-3">
                <div
                  v-for="u in assignedMembers(e)"
                  :key="u.id"
                  class="w-7 h-7 rounded-full bg-white/10 grid place-items-center text-xs"
                >
                  {{ initials(userDisplayName(u)) }}
                </div>

                <span v-if="!assignedMembers(e).length" class="text-white/50 text-sm">
                  Aucun membre assigné
                </span>
              </div>
            </article>
          </div>
        </section>
      </section>

      <!-- MODAL AJOUT DOCUMENT -->
      <div
        v-if="showAddDocument"
        class="fixed inset-0 bg-black/60 grid place-items-center z-50"
      >
        <div class="w-full max-w-md bg-[#1B2130] rounded-2xl p-6">
          <div class="flex justify-between mb-4">
            <h3 class="font-bold">Ajouter</h3>
            <button @click="showAddDocument = false">✕</button>
          </div>

          <div class="flex gap-2 mb-6">
            <button
              class="flex-1 py-2 rounded-lg"
              :class="documentTab === 'document' ? 'bg-[#CFFFBC]/20 text-[#CFFFBC]' : 'bg-white/10'"
              @click="documentTab = 'document'"
            >
              Document
            </button>
            <button
              class="flex-1 py-2 rounded-lg"
              :class="documentTab === 'lien' ? 'bg-[#CFFFBC]/20 text-[#CFFFBC]' : 'bg-white/10'"
              @click="documentTab = 'lien'"
            >
              Lien
            </button>
          </div>

          <div v-if="documentTab === 'document'" class="space-y-4">
            <div class="h-40 border border-dashed border-white/30 rounded-xl grid place-items-center">
              Dépose le fichier
            </div>
            <input class="w-full px-4 py-2 rounded-lg bg-black/30" placeholder="Titre" />
          </div>

          <div v-else class="space-y-4">
            <input class="w-full px-4 py-2 rounded-lg bg-black/30" placeholder="Titre" />
            <input class="w-full px-4 py-2 rounded-lg bg-black/30" placeholder="URL" />
          </div>

          <button class="mt-6 w-full py-3 rounded-xl bg-[#CFFFBC] text-black font-bold">
            Enregistrer
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
