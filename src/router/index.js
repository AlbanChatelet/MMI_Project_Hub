import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../pages/index.vue'
import ProjetDetail from '../pages/projets/[id].vue'
import ComponentTest from '../pages/component_test.vue'
import Login from '@/pages/login.vue'
import ProposerProjet from '@/pages/proposer_projet.vue'
import MentionsLegales from '@/pages/mentions_legales.vue'
import Register from '@/pages/register.vue'
import Galerie from '@/pages/galerie.vue'
import SujetsIndex from '@/pages/sujets/index.vue'
import SujetsListe from '@/pages/sujets/liste.vue'
import SujetDetail from '@/pages/sujets/[id].vue'

// ✅ Nouveaux imports (à créer si pas encore fait)
import Users from '@/pages/users.vue'
import EleveDashboard from '@/pages/eleve-dashboard.vue'
import EnseignantDashboard from '@/pages/enseignant-dashboard.vue'
import AdminDashboard from '@/pages/admin-dashboard.vue'
import Politique_confidentialite from '@/pages/politique_confidentialite.vue'
import SecuriteDonnee from '@/pages/securite_donnee.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },

  { path: '/component_test', name: 'component_test', component: ComponentTest },

  { path: '/projets/:id', name: 'projet-detail', component: ProjetDetail },

  { path: '/login', name: 'login', component: Login },

  { path: '/proposer_projet', name: 'proposer_projet', component: ProposerProjet },

  { path: '/mentions_legales', name: 'mentions_legales', component: MentionsLegales },

  { path: '/politique_confidentialite', name: 'politique_confidentialite', component: Politique_confidentialite },

  { path: '/securite_donnee', name: 'securite_donnee', component: SecuriteDonnee },


  { path: '/register', name: 'register', component: Register },

  // ✅ ROUTE USERS
  { path: '/users', name: 'users', component: Users },

  {
    path: '/galerie',
    name: 'galerie',
    component: Galerie
  },
  {
    path: '/sujets',
    name: 'sujets-index',
    component: SujetsIndex
  },
  {
    path: '/sujets/liste',
    name: 'sujets-liste',
    component: SujetsListe
  },
  {
    path: '/sujets/:id',
    name: 'sujet-detail',
    component: SujetDetail
  },

  // ✅ DASHBOARDS
  { path: '/eleve-dashboard', name: 'eleve-dashboard', component: EleveDashboard },
  { path: '/enseignant-dashboard', name: 'enseignant-dashboard', component: EnseignantDashboard },
  { path: '/admin-dashboard', name: 'admin-dashboard', component: AdminDashboard }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})
