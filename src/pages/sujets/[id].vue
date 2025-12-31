<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import AppHeader from "@/components/AppHeader.vue";
import { pb } from "../../pb";

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const error = ref("");
const sujet = ref(null);

const id = computed(() => String(route.params.id || ""));

const anneeLabel = (a) => {
  const s = String(a || "");
  if (s === "1") return "1ère année";
  if (s === "2") return "2ème année";
  if (s === "3") return "3ème année";
  return s ? `${s}ème année` : "";
};

const typeLabel = (t) => {
  const s = String(t || "").toLowerCase();
  if (s === "collectif") return "Collectif";
  if (s === "solo") return "Individuel";
  return t || "";
};

// URLs fichiers
const imageMarqueUrl = computed(() => {
  if (!sujet.value?.image_marque) return null;
  return pb.files.getUrl(sujet.value, sujet.value.image_marque);
});

const sujetPdfUrl = computed(() => {
  if (!sujet.value?.sujet_pdf) return null;
  return pb.files.getUrl(sujet.value, sujet.value.sujet_pdf);
});

onMounted(async () => {
  try {
    if (!id.value) {
      router.replace("/sujets");
      return;
    }

    // ⚠️ "sujets" = nom de ta collection (vu sur ton screen)
    sujet.value = await pb.collection("sujets").getOne(id.value, {
      expand: "commanditaire",
    });
  } catch (e) {
    console.error(e);
    error.value =
      e?.data?.message ||
      e?.message ||
      "Impossible de charger ce sujet.";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="min-h-screen bg-[#151A24] text-white">
    <AppHeader />

    <div class="max-w-6xl mx-auto px-6 py-10">
      <p v-if="loading" class="text-white/70">Chargement...</p>
      <p v-else-if="error" class="text-red-300 font-medium">{{ error }}</p>

      <template v-else>
        <!-- Haut de page -->
        <div class="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <h1 class="text-4xl md:text-5xl font-extrabold leading-tight">
              {{ sujet?.titre || "(Sans titre)" }}
            </h1>

            <div class="mt-4 flex flex-wrap items-center gap-3">
              <span
                v-if="sujet?.annee"
                class="px-4 py-2 rounded-full bg-[#CFFFBC] text-black font-semibold text-sm"
              >
                {{ anneeLabel(sujet.annee) }}
              </span>

              <span
                v-if="sujet?.type_sujet"
                class="px-4 py-2 rounded-full bg-[#CFFFBC] text-black font-semibold text-sm"
              >
                {{ typeLabel(sujet.type_sujet) }}
              </span>

              <span class="text-white/60 text-sm">
                Commanditaire :
                <span class="text-white font-semibold">
                  {{
                    sujet?.expand?.commanditaire?.name
                    || sujet?.expand?.commanditaire?.username
                    || sujet?.expand?.commanditaire?.email
                    || "Non renseigné"
                  }}
                </span>
              </span>
            </div>
          </div>

          <button
            type="button"
            class="text-[#CFFFBC] hover:underline"
            @click="$router.push('/sujets')"
          >
            ← Retour
          </button>
        </div>

        <!-- Contenu (2 colonnes) -->
        <div class="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Colonne gauche : contenu -->
          <div class="lg:col-span-2 space-y-8">
            <!-- Description -->
            <section class="rounded-2xl border border-white/10 bg-black/20 p-6">
              <h2 class="text-xl font-extrabold mb-3">Description</h2>
              <p class="text-white/80 leading-relaxed whitespace-pre-line">
                {{ sujet?.description || "—" }}
              </p>
            </section>

            <!-- Objectifs -->
            <section class="rounded-2xl border border-white/10 bg-black/20 p-6">
              <h2 class="text-xl font-extrabold mb-3">Objectifs</h2>
              <p class="text-white/80 leading-relaxed whitespace-pre-line">
                {{ sujet?.objectifs || "—" }}
              </p>
            </section>

            <!-- Compétences -->
            <section class="rounded-2xl border border-white/10 bg-black/20 p-6">
              <h2 class="text-xl font-extrabold mb-4">Compétences</h2>

              <div v-if="(sujet?.competences || []).length" class="flex flex-wrap gap-3">
                <span
                  v-for="c in sujet.competences"
                  :key="c"
                  class="px-4 py-2 rounded-full border border-white/15 bg-white/5 text-white/90 text-sm"
                >
                  {{ c }}
                </span>
              </div>

              <p v-else class="text-white/60">Aucune compétence renseignée.</p>
            </section>
          </div>

          <!-- Colonne droite : fichiers / contact -->
          <aside class="space-y-6">
            <!-- Image marque -->
            <section class="rounded-2xl border border-white/10 bg-black/20 p-5">
              <h3 class="font-extrabold mb-3">Image de marque</h3>

              <img
                v-if="imageMarqueUrl"
                :src="imageMarqueUrl"
                alt="Image de marque"
                class="w-full h-48 object-cover rounded-xl border border-white/10"
              />

              <div v-else class="w-full h-48 rounded-xl bg-white/5 border border-white/10" />
            </section>

            <!-- PDF -->
            <section class="rounded-2xl border border-white/10 bg-black/20 p-5">
              <h3 class="font-extrabold mb-3">Sujet (PDF)</h3>

              <a
                v-if="sujetPdfUrl"
                :href="sujetPdfUrl"
                target="_blank"
                rel="noreferrer"
                class="inline-flex items-center justify-center w-full bg-[#CFFFBC] text-black font-semibold py-3 rounded-full hover:bg-[#B8E6A8] transition"
              >
                Télécharger le PDF
              </a>

              <p v-else class="text-white/60">Aucun PDF fourni.</p>
            </section>

            <!-- Contact -->
            <section class="rounded-2xl border border-white/10 bg-black/20 p-5">
              <h3 class="font-extrabold mb-2">Contact</h3>
              <p class="text-white/80 text-sm">
                Email :
                <span class="text-white font-semibold">
                  {{ sujet?.mail || "—" }}
                </span>
              </p>
            </section>
          </aside>
        </div>
      </template>
    </div>
  </div>
</template>
