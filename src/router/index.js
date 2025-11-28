import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../pages/index.vue'
import ProjetDetail from '../pages/projets/[id].vue'
import ComponentTest from '../pages/component_test.vue'
import Login from '@/pages/login.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/component_test',
    name: 'component_test',
    component: ComponentTest
  },
  {
    path: '/projets/:id',
    name: 'projet-detail',
    component: ProjetDetail
  },
  {
    path: '/login',
    name: 'login',
    component: Login
  }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})
