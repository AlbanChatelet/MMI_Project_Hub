import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../pages/projets/index.vue'
import ProjetDetail from '../pages/projets/[id].vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/projets/:id',
    name: 'projet-detail',
    component: ProjetDetail
  }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})
