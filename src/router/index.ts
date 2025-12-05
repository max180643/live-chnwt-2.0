import { createRouter, createWebHistory } from 'vue-router';

import { env } from '@/env/constants';

const routes = [
  { path: '/', name: 'home', component: () => import('@/views/home/Home.vue'), meta: { title: 'Home' } },
  { path: '/live/:id', name: 'live', component: () => import('@/views/live/Live.vue'), meta: { title: 'Live' } },
  {
    path: '/broadcast',
    name: 'broadcast',
    component: () => import('@/views/broadcast/Broadcast.vue'),
    meta: { title: 'Broadcast' },
  },
];

export const router = createRouter({
  history: createWebHistory(env.baseUrl),
  routes,
});

// Set document title on route change
router.afterEach((to) => {
  if (to.meta && to.meta.title) {
    const defaultTitle = 'LIVE - CHNWT';
    document.title = `${to.meta.title} | ${defaultTitle}`;
  }
});
