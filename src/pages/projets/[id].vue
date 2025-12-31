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
const projet = ref(null);

const id = computed(() => String(route.params.id || ""));

// --- helpers labels ---
const parcoursLabel = (p) => {
  const s = String(p || "").toLowerCase();
  if (s === "dev") return "Développement";
  if (s === "créa" || s === "crea") return "Design";
  if (s === "com") return "Communication";
  return p || "";
};

const anneeLabel = (a) => {
  const s = String(a || "");
  if (s === "1") return "1ère année";
  if (s === "2") return "2ème année";
  if (s === "3") return "3ème année";
  return s ? `${s}ème année` : "";
};

// --- files URLs ---
const heroImageUrl = computed(() => {
  if (!projet.value) return null;
  const file = projet.value.photo || projet.value.apercu;
  if (!file) return null;
  return pb.files.getUrl(projet.value, file);
});

const sujetPdfUrl = computed(() => {
  if (!projet.value?.sujet_pdf) return null;
  return pb.files.getUrl(projet.value, projet.value.sujet_pdf);
});

// --- promo chips (année + parcours) ---
// promo = relation multiple vers Promotion, donc on prend expand.promo[]
const promoBadges = computed(() => {
  const promos = projet.value?.expand?.promo;
  if (!Array.isArray(promos)) return [];
  // exemple: 2023-2026 + mm*i + parcours
  return promos.map((pr) => {
    return {
      id: pr.id,
      promo: pr.promo, // 2023-2026
      annee: pr.annee, // 1/2/3
      parcours: pr.parcours, // dev/crea/com
      presentable: pr.presentable, // si tu l’utilises
    };
  });
});

onMounted(async () => {
  try {
    if (!id.value) {
      router.replace("/");
      return;
    }

    projet.value = await pb.collection("Projet").getOne(id.value, {
      expand: "commanditaire,promo",
    });
  } catch (e) {
    console.error("Projet detail error:", e, e?.data);
    error.value = e?.data?.message || e?.message || "Projet introuvable.";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="min-h-screen bg-[#151A24] text-white">
    <AppHeader />

    <!-- LOADING / ERROR -->
    <div v-if="loading" class="max-w-6xl mx-auto px-6 py-10 text-white/70">
      Chargement...
    </div>

    <div v-else-if="error" class="max-w-6xl mx-auto px-6 py-10 text-red-300">
      {{ error }}
    </div>

    <template v-else>
      <!-- HERO -->
      <section class="relative">
        <div class="h-[420px] w-full overflow-hidden">
          <img
            v-if="heroImageUrl"
            :src="heroImageUrl"
            alt="Visuel du projet"
            class="w-full h-full object-cover"
          />
          <div
            v-else
            class="w-full h-full bg-gradient-to-br from-white/10 to-black/50"
          />
        </div>

        <!-- dark overlay -->
        <div class="absolute inset-0 bg-black/55" />

        <!-- top content -->
        <div class="absolute inset-0">
          <div class="max-w-6xl mx-auto px-6 pt-12">
            <button
              class="text-[#CFFFBC] hover:underline"
              @click="$router.back()"
            >
              ← Retour
            </button>

            <div class="mt-16 max-w-2xl">
              <h1 class="text-4xl md:text-5xl font-extrabold text-[#CFFFBC] leading-tight">
                {{ projet?.titre || "(Sans titre)" }}
              </h1>

              <p class="mt-3 text-white/80 text-sm">
                <span class="font-semibold">Commanditaire :</span>
                {{
                  projet?.expand?.commanditaire?.name
                  || projet?.expand?.commanditaire?.username
                  || projet?.expand?.commanditaire?.email
                  || "Non renseigné"
                }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- CONTENT PANEL -->
      <section class="max-w-6xl mx-auto px-6 mt-12 pb-16">
        <div class="rounded-3xl bg-[#1B2130] border border-white/10 shadow-xl p-8">
          <!-- DESCRIPTION -->
          <div class="text-white/85 leading-relaxed whitespace-pre-line">
            {{ projet?.description || "Aucune description." }}
          </div>

          <!-- PROMOS (année/parcours) : optionnel, mais utile -->
          <div v-if="promoBadges.length" class="mt-8">
            <h2 class="font-bold text-white mb-3">Parcours concernés</h2>
            <div class="flex flex-wrap gap-3">
              <span
                v-for="b in promoBadges"
                :key="b.id"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-white/85"
              >
                <span class="font-semibold text-[#CFFFBC]">
                  {{ anneeLabel(b.annee) }}
                </span>
                <span class="opacity-70">•</span>
                <span>{{ parcoursLabel(b.parcours) }}</span>
                <span v-if="b.promo" class="opacity-60">({{ b.promo }})</span>
              </span>
            </div>
          </div>

          <!-- GRID: compétences + documents -->
          <div class="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
            <!-- Compétences -->
            <div>
              <h2 class="font-bold text-white mb-4">Compétences mobilisées</h2>

              <div v-if="(projet?.competences || []).length" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  v-for="c in projet.competences"
                  :key="c"
                  class="rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-sm text-white/85"
                >
                  {{ c }}
                </div>
              </div>

              <p v-else class="text-white/60 text-sm">
                Aucune compétence renseignée.
              </p>
            </div>

            <!-- Documents -->
            <div>
              <h2 class="font-bold text-white mb-4">Documents utiles</h2>

              <div class="flex gap-4 flex-wrap">
                <!-- PDF sujet -->
                <a
                  v-if="sujetPdfUrl"
                  :href="sujetPdfUrl"
                  target="_blank"
                  rel="noreferrer"
                  class="w-40 h-28 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition flex flex-col items-center justify-center gap-2"
                >
                  <div class="text-[#CFFFBC] text-3xl">📄</div>
                  <span class="text-[#CFFFBC] font-semibold">Sujet</span>
                </a>

                <!-- Exemple carte “lien” (si tu ajoutes un champ plus tard) -->
                <!--
                <a
                  v-if="projet?.lien_utile"
                  :href="projet.lien_utile"
                  target="_blank"
                  rel="noreferrer"
                  class="w-40 h-28 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition flex flex-col items-center justify-center gap-2"
                >
                  <div class="text-[#CFFFBC] text-3xl">🌐</div>
                  <span class="text-[#CFFFBC] font-semibold">Lien</span>
                </a>
                -->

                <p v-if="!sujetPdfUrl" class="text-white/60 text-sm">
                  Aucun document fourni.
                </p>
              </div>
            </div>
          </div>

          <!-- CTA -->
          <div class="mt-12">
            <button
              class="w-full rounded-full bg-[#CFFFBC] text-black font-semibold py-4 hover:bg-[#B8E6A8] transition"
              type="button"
              @click="alert('Ici tu pourras ouvrir un formulaire ou envoyer une demande 👍')"
            >
              Demander ce projet
            </button>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
