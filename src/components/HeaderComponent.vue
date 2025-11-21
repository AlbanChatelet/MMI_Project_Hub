<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <header class="app-header">
    <div class="brand">
      <button class="menu-btn" @click="showMenu = !showMenu" aria-label="Toggle menu">
        <span class="hamburger" :class="{ open: showMenu }"></span>
      </button>

      <div class="logo" aria-hidden="true">
        <!-- simple inline logo -->
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="18" height="18" rx="4" :fill="logoColor"/>
          <path d="M7 12h10" stroke="white" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M7 8h10" stroke="white" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M7 16h6" stroke="white" stroke-width="1.6" stroke-linecap="round"/>
        </svg>
      </div>

      <div class="titles">
        <h1 class="title">{{ title }}</h1>
        <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
      </div>
    </div>

    <nav class="nav" :class="{ open: showMenu }" aria-label="Main navigation">
      <!-- default slot for links; falls back to simple example links -->
      <slot>
        <a href="#" class="nav-link">Galerie</a>
        <a href="#" class="nav-link">Projets à la une</a>
        <a href="#" class="nav-link">Mon espace</a>
      </slot>
    </nav>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  title: { type: String, default: 'MMI Project Hub' },
  subtitle: { type: String, default: '' },
  logoColor: { type: String, default: '#4F46E5' } // purple-600
})

const showMenu = ref(false)
const logoColor = computed(() => props.logoColor)
</script>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.6rem 1rem;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 20;
}

/* Brand area */
.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo { display: inline-flex; align-items: center; }

.titles {
  display: flex;
  flex-direction: column;
  line-height: 1;
}
.title {
  font-size: 1.05rem;
  margin: 0;
  font-weight: 600;
  color: #111827;
}
.subtitle {
  margin: 0;
  font-size: 0.8rem;
  color: #6b7280;
}

/* Nav */
.nav {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.nav-link {
  text-decoration: none;
  color: #374151;
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
  transition: background .12s ease;
}
.nav-link:hover { background: #f3f4f6; }

/* Mobile menu button */
.menu-btn {
  display: none;
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
}
.hamburger {
  width: 22px;
  height: 2px;
  background: #374151;
  position: relative;
  display: inline-block;
  transition: transform .18s ease;
}
.hamburger::before,
.hamburger::after {
  content: "";
  width: 22px;
  height: 2px;
  background: #374151;
  position: absolute;
  left: 0;
  transition: transform .18s ease, top .18s ease, opacity .18s ease;
}
.hamburger::before { top: -6px; }
.hamburger::after { top: 6px; }
.hamburger.open {
  background: transparent;
}
.hamburger.open::before { transform: rotate(45deg); top: 0; }
.hamburger.open::after { transform: rotate(-45deg); top: 0; }

/* Responsive: collapse nav on small screens */
@media (max-width: 768px) {
  .menu-btn { display: inline-flex; align-items: center; margin-right: 0.25rem; }
  .nav {
    position: absolute;
    top: 64px;
    right: 1rem;
    background: white;
    flex-direction: column;
    padding: 0.5rem;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 6px 18px rgba(15,23,42,0.06);
    display: none;
    min-width: 160px;
  }
  .nav.open { display: flex; }
}
</style>
