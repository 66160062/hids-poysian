import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/IndexPage.vue') }],
  },

  {
    path: '/login',
    component: () => import('layouts/FullScreen.vue'),
    children: [{ path: '', component: () => import('pages/LoginPage.vue') }],
  },
  {
    path: '/customer',
    component: () => import('layouts/CustomerScreen.vue'),
    children: [{ path: '', component: () => import('pages/CustomerMainPage.vue') },
      { path: 'defect',   name: 'defectList',     component: () => import('pages/CustomerDefectListPage.vue'), meta: { title: 'รายการ Defect' } },
      { path: 'report',   name: 'reportList',     component: () => import('pages/CustomerReportPage.vue'), meta: { title: 'สรุปรายงาน' } }
    ],
  },

  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
