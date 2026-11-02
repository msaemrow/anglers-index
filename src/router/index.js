import { createRouter, createWebHistory } from 'vue-router'
import { requireSession } from './auth.js'
import DashboardView from '@/views/DashboardView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
    {
      path: '/dashboard',
      alias: ['/:username/profile'],
      name: 'dashboard',
      meta: { requiresAuth: true },
      component: DashboardView,
    },
    {
      path: '/:username/fishcatch/new',
      name: 'new-fish-catch',
      meta: { requiresAuth: true },
      redirect: (to) => ({
        name: 'fish-catches',
        params: { username: to.params.username },
        query: { add: 'catch' },
      }),
    },
    {
      path: '/:username/fishcatch/all',
      name: 'fish-catches',
      meta: { requiresAuth: true },
      component: () => import('@/views/FishCatchesView.vue'),
    },
    {
      path: '/:username/fishcatch/:id(\\d+)',
      name: 'fish-catch',
      meta: { requiresAuth: true },
      component: () => import('@/views/FishCatchView.vue'),
    },
    {
      path: '/:username/catch-analysis',
      name: 'catch-analysis',
      meta: { requiresAuth: true },
      component: () => import('@/views/CatchAnalysisView.vue'),
    },
    {
      path: '/:username/trips',
      name: 'trips',
      meta: { requiresAuth: true },
      component: () => import('@/views/TripsView.vue'),
    },
    {
      path: '/:username/trips/:id(\\d+)',
      name: 'trip',
      meta: { requiresAuth: true },
      component: () => import('@/views/TripView.vue'),
    },
    {
      path: '/waypoints',
      name: 'waypoints',
      meta: { requiresAuth: true },
      component: () => import('@/views/WaypointsView.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      meta: { requiresAuth: true },
      component: () => import('@/views/SettingsView.vue'),
    },
    { path: '/resources', name: 'resources', component: () => import('@/views/ResourcesView.vue') },
    ...['podcasts', 'channels', 'how-to-videos', 'blog'].map((kind) => ({
      path: `/resources/${kind}`,
      name: `resources-${kind}`,
      component: () => import('@/views/ResourcesView.vue'),
      props: { kind },
    })),
    {
      path: '/:username/fish-mode',
      name: 'fish-mode',
      meta: { requiresAuth: true },
      component: () => import('@/views/FishModeView.vue'),
    },
    { path: '/species/all', name: 'species', component: () => import('@/views/SpeciesView.vue') },
    { path: '/lakes/all', name: 'lakes', component: () => import('@/views/LakesView.vue') },
    { path: '/lakes/:id(\\d+)', name: 'lake', component: () => import('@/views/LakeView.vue') },
    {
      path: '/:username/tackle-box',
      name: 'tackle-box',
      meta: { requiresAuth: true },
      component: () => import('@/views/TackleBoxView.vue'),
    },
    { path: '/lure/all', name: 'lures', component: () => import('@/views/LuresView.vue') },
    { path: '/lure/:id(\\d+)', name: 'lure', component: () => import('@/views/LureView.vue') },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-implemented',
      component: () => import('@/views/NotImplementedView.vue'),
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(requireSession)

export default router
