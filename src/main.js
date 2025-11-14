import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'

export const API_URL = import.meta.env.VITE_API_URL

createApp(App).use(router).mount('#app')
