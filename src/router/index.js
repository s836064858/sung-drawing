import { createRouter, createWebHistory } from 'vue-router'
import EditorLayout from '../views/editor/editor-layout.vue'

const routes = [
  {
    path: '/',
    name: 'Editor',
    component: EditorLayout
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
