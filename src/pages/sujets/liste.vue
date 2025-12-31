<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { pb } from "../../pb";
import AppHeader from "@/components/AppHeader.vue";

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const error = ref(null);
const sujets = ref([]);

const annee = computed(() => String(route.query.annee || ""));
const type = computed(() => String(route.query.type || ""));

const anneeLabel = (a) => {
  const s = String(a || "");
  if (s === "1") return "1ère année";
  if (s === "2") return "2ème année";
  if (s === "3") return "3ème année";
  return s;
};
const typeLabel = (t) => {
  const s = String(t || "").toLowerCase();
  if (s === "collectif") return "Collectif";
  if (s === "solo") return "Individuel";
  return s;
};

onMounted(async () => {
  try {
    if (!annee.value || !type.value) {
      router.replace("/sujets");
      return;
    }

    sujets.value = await pb.collection("sujets").getFullList({
      sort: "-created",
      expand: "commanditaire",
      filter: `annee="${annee.value}" && type_sujet="${type.value}"`,
    });
  } catch (e) {
    console.error("PB error", e, e?.data);
    error.value = e?.data?.message || e?.message || "Erreur lors du chargement des sujets";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="min-h-screen bg-[#151A24] text-white">
    <AppHeader />

    <div class="max-w-6xl mx-auto px-6 pb-14">
      <div class="pt-10 flex items-start justify-between gap-6">
        <div>
          <h1 class="text-4xl font-extrabold">Sujets proposés</h1>
          <p class="text-white/70 mt-3">
            {{ anneeLabel(annee) }} • {{ typeLabel(type) }}
          </p>
        </div>

        <button
          class="text-[#CFFFBC] hover:underline mt-2"
          @click="$router.push('/sujets')"
        >
          Modifier mes choix
        </button>
      </div>

      <p v-if="loading" class="text-white/70 mt-10">Chargement...</p>
      <p v-else-if="error" class="text-red-300 mt-10">{{ error }}</p>

      <template v-else>
        <div
          v-if="sujets.length"
          class="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <!-- ✅ RouterLink DANS le v-for -->
          <RouterLink
            v-for="s in sujets"
            :key="s.id"
            :to="`/sujets/${s.id}`"
            class="block"
          >
            <article
              class="relative rounded-3xl overflow-hidden bg-black/40 border border-white/10 shadow-xl hover:border-white/20 transition"
            >
              <!-- Placeholder “image” -->
              <div class="w-full h-48 bg-gradient-to-br from-white/10 to-black/40" />

              <div
                class="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent"
              >
                <h3 class="text-2xl font-extrabold text-[#CFFFBC] leading-tight">
                  {{ s.titre || "(Sans titre)" }}
                </h3>

                <p class="mt-2 text-white/80 text-sm">
                  <span class="font-semibold">Commanditaire :</span>
                  {{
                    s.expand?.commanditaire?.name
                    || s.expand?.commanditaire?.username
                    || s.expand?.commanditaire?.email
                    || "Non renseigné"
                  }}
                </p>
              </div>
            </article>
          </RouterLink>
        </div>

        <p v-else class="text-white/60 mt-10">
          Aucun sujet trouvé pour ces critères.
        </p>
      </template>
    </div>
  </div>
</template>
