<template>
  <header class="sticky top-0 z-50 w-full bg-[#1A1D29] border-b border-gray-800 px-4 py-3">
    <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-4">

      <div class="flex items-center gap-3 min-w-max">
        <div class="shrink-0">
          <img :src="logo" alt="Logo" class="w-10 h-10 md:w-12 md:h-12" />
        </div>
        <div class="flex flex-col justify-center">
          <h1 class="text-base md:text-xl font-bold text-[#CCFFBC] leading-none m-0 uppercase tracking-tight">
            {{ title }}
          </h1>
          <p v-if="subtitle" class="text-[10px] md:text-xs text-[#CCFFBC] font-bold m-0 opacity-90">
            {{ subtitle }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2 sm:gap-4">
        <nav class="hidden lg:flex items-center gap-6 mr-4">
          <a href="#" class="text-[#CCFFBC] text-sm font-medium hover:underline">Galerie</a>
          <a href="#" class="text-[#CCFFBC] text-sm font-medium hover:underline">Projets à la une</a>
        </nav>

        <a
          href="#"
          class="inline-flex items-center gap-2 bg-[#CCFFBC] text-[#1A1D29] px-4 py-2 md:px-6 md:py-2.5 rounded-full font-bold text-xs md:text-sm whitespace-nowrap transition-transform active:scale-95"
        >
          <span>Mon espace</span>
          <span class="text-base md:text-lg">›</span>
        </a>

        <button @click="showMenu = !showMenu" class="lg:hidden text-[#CCFFBC] p-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
      </div>
    </div>

    <div v-if="showMenu" class="lg:hidden mt-4 pb-2 flex flex-col gap-3 border-t border-gray-800 pt-4">
      <a href="#" class="text-[#CCFFBC] text-sm font-medium">Galerie</a>
      <a href="#" class="text-[#CCFFBC] text-sm font-medium">Projets à la une</a>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import logo from '@/assets/logo.svg'

defineProps({
  title: { type: String, default: 'MMI HUB!' },
  subtitle: { type: String, default: 'PROJECT' },
})

const showMenu = ref(false)
</script>
