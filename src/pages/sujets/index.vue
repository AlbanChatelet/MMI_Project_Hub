<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import AppHeader from "@/components/AppHeader.vue";

const router = useRouter();

const step = ref(1); // 1 = année, 2 = type
const selectedAnnee = ref(""); // "1" | "2" | "3"
const selectedType = ref(""); // "collectif" | "solo"

const goStep2 = (annee) => {
  selectedAnnee.value = String(annee);
  step.value = 2;
};

const chooseType = (type) => {
  selectedType.value = type;
  router.push({
    path: "/sujets/liste",
    query: {
      annee: selectedAnnee.value,
      type: selectedType.value,
    },
  });
};

const reset = () => {
  step.value = 1;
  selectedAnnee.value = "";
  selectedType.value = "";
};
</script>

<template>
  <div class="min-h-screen bg-[#151A24] text-white">
    <AppHeader />

    <div class="max-w-6xl mx-auto px-6 pb-14">
      <div class="pt-10">
        <h1 class="text-5xl font-extrabold">Liste des sujets</h1>

        <!-- Step 1 : Année -->
        <div v-if="step === 1" class="mt-16">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <button
              type="button"
              @click="goStep2(1)"
              class="relative rounded-xl bg-[#CFFFBC] text-[#151A24] p-10 min-h-[170px] flex flex-col justify-center text-left hover:brightness-95 transition"
            >
              <div class="text-4xl font-extrabold leading-tight">
                1ère<br />année
              </div>
              <div class="absolute bottom-8 right-8 text-4xl">↗</div>
            </button>

            <button
              type="button"
              @click="goStep2(2)"
              class="relative rounded-xl bg-[#CFFFBC] text-[#151A24] p-10 min-h-[170px] flex flex-col justify-center text-left hover:brightness-95 transition"
            >
              <div class="text-4xl font-extrabold leading-tight">
                2ème<br />année
              </div>
              <div class="absolute bottom-8 right-8 text-4xl">↗</div>
            </button>

            <button
              type="button"
              @click="goStep2(3)"
              class="relative rounded-xl bg-[#CFFFBC] text-[#151A24] p-10 min-h-[170px] flex flex-col justify-center text-left hover:brightness-95 transition"
            >
              <div class="text-4xl font-extrabold leading-tight">
                3ème<br />année
              </div>
              <div class="absolute bottom-8 right-8 text-4xl">↗</div>
            </button>
          </div>
        </div>

        <!-- Step 2 : Type -->
        <div v-else class="mt-16">
          <div class="flex items-center gap-3 text-white/70">
            <span>Année choisie :</span>
            <span class="text-white font-semibold">
              {{ selectedAnnee }}{{ selectedAnnee === "1" ? "ère" : "ème" }} année
            </span>
            <button class="ml-3 text-[#CFFFBC] hover:underline text-sm" @click="reset">
              changer
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 max-w-4xl">
            <button
              type="button"
              @click="chooseType('collectif')"
              class="relative rounded-xl bg-[#CFFFBC] text-[#151A24] p-10 min-h-[190px] flex flex-col justify-center text-left hover:brightness-95 transition"
            >
              <div class="text-5xl font-extrabold leading-tight">
                Projet<br />collectif
              </div>
              <div class="absolute bottom-8 right-8 text-4xl">↗</div>
            </button>

            <button
              type="button"
              @click="chooseType('solo')"
              class="relative rounded-xl bg-[#CFFFBC] text-[#151A24] p-10 min-h-[190px] flex flex-col justify-center text-left hover:brightness-95 transition"
            >
              <div class="text-5xl font-extrabold leading-tight">
                Projet<br />individuel
              </div>
              <div class="absolute bottom-8 right-8 text-4xl">↗</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
