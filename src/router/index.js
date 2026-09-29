import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/dashboard',
      alias: ['/', '/:username/profile'],
      name: 'dashboard',
      component: DashboardView,
    },
    {
      path: '/:username/fishcatch/all',
      name: 'fish-catches',
      component: () => import('@/views/FishCatchesView.vue'),
    },
    {
      path: '/:username/fishcatch/:id(\\d+)',
      name: 'fish-catch',
      component: () => import('@/views/FishCatchView.vue'),
    },
    { path: '/lakes/all', name: 'lakes', component: () => import('@/views/LakesView.vue') },
    { path: '/lakes/:id(\\d+)', name: 'lake', component: () => import('@/views/LakeView.vue') },
    { path: '/lure/all', name: 'lures', component: () => import('@/views/LuresView.vue') },
    { path: '/lure/:id(\\d+)', name: 'lure', component: () => import('@/views/LureView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})
