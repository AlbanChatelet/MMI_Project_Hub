<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <header class="flex items-center justify-between gap-4 px-4 py-2 bg-[#1A1D29] border-b border-gray-200 sticky top-0 z-20">
    <!-- Brand area -->
    <div class="flex items-center gap-3">

      <!-- Logo -->
      <div class="inline-flex items-center" aria-hidden="true">
        <img :src="logo" alt="Logo" class="w-9 h-9" />
      </div>

      <!-- Titles -->
      <div class="flex flex-col leading-none">
        <h1 class="text-[1.05rem] font-semibold text-[#CCFFBC] m-0">{{ title }}</h1>
        <p v-if="subtitle" class="text-[#CCFFBC]  m-0">{{ subtitle }}</p>
      </div>
    </div>

    <!-- Navigation -->
    <nav
      class="hidden md:flex flex-row items-center gap-2"
      :class="{ 'flex flex-col absolute top-16 right-4 bg-white p-2 border border-gray-200 rounded-lg shadow-md min-w-[160px]': showMenu }"
      aria-label="Main navigation"
    >
      <slot>
        <a href="#" class="text-[#CCFFBC] px-2 py-1 rounded-md">Galerie</a>
        <a href="#" class="text-[#CCFFBC] px-2 py-1 rounded-md">Projets à la une</a>
        <a href="#" class="text-[#1A1D29] px-2 py-1 rounded-md bg-[#CCFFBC] transition-colors">Mon espace</a>
      </slot>
    </nav>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import logo from '@/assets/logo.svg' // <-- import direct


const { title, subtitle} = defineProps({
  title: { type: String, default: 'MMI Project Hub' },
  subtitle: { type: String, default: '' },
})

const showMenu = ref(false)
</script>
