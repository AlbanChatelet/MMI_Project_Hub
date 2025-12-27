import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../pages/index.vue'
import ProjetDetail from '../pages/projets/[id].vue'
import ComponentTest from '../pages/component_test.vue'
import Login from '@/pages/login.vue'
import ProposerProjet from '@/pages/proposer_projet.vue'
import Register from '@/pages/register.vue'
import Galerie from '@/pages/galerie.vue'
import SujetsIndex from '@/pages/sujets/index.vue'
import SujetsListe from '@/pages/sujets/liste.vue'

// ✅ Nouveaux imports (à créer si pas encore fait)
import Users from '@/pages/users.vue'
import EleveDashboard from '@/pages/eleve-dashboard.vue'
import EnseignantDashboard from '@/pages/enseignant-dashboard.vue'
import AdminDashboard from '@/pages/admin-dashboard.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },

  { path: '/component_test', name: 'component_test', component: ComponentTest },

  { path: '/projets/:id', name: 'projet-detail', component: ProjetDetail },

  { path: '/login', name: 'login', component: Login },

  { path: '/proposer_projet', name: 'proposer_projet', component: ProposerProjet },

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

  // ✅ DASHBOARDS
  { path: '/eleve-dashboard', name: 'eleve-dashboard', component: EleveDashboard },
  { path: '/enseignant-dashboard', name: 'enseignant-dashboard', component: EnseignantDashboard },
  { path: '/admin-dashboard', name: 'admin-dashboard', component: AdminDashboard }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})
