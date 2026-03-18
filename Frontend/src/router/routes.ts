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
    path: '/dashboard',
    component: () => import('layouts/FullScreen.vue'),
    meta: { requiresAuth: true }, // ⭐ ต้องมีบรรทัดนี้
    children: [{ path: '', component: () => import('pages/DashboardTestPage.vue') }],
  },

  // {
  //   path: '/customer',
  //   component: () => import('layouts/CustomerScreen.vue'),
  //   children: [
  //     { path: '', component: () => import('pages/CustomerMainPage.vue') },
  //     {
  //       path: 'defect',
  //       name: 'defectList',
  //       component: () => import('pages/CustomerDefectListPage.vue'),
  //       meta: { title: 'รายการ Defect' },
  //     },
  //     {
  //       path: 'report',
  //       name: 'reportList',
  //       component: () => import('pages/CustomerReportPage.vue'),
  //       meta: { title: 'สรุปรายงาน' },
  //     },
  //   ],
  // },
    path: '/customer',
    component: () => import('layouts/CustomerScreen.vue'),
    children: [
      { path: '', component: () => import('pages/CustomerMainPage.vue') },
      {
        path: 'defect',
        name: 'defectList',
        component: () => import('pages/CustomerDefectListPage.vue'),
        meta: { title: 'รายการ Defect' },
      },
      {
        path: 'report',
        name: 'reportList',
        component: () => import('pages/CustomerReportPage.vue'),
        meta: { title: 'สรุปรายงาน' },
      },
    ],
  },
  {
    path: '/admin',
    component: () => import('layouts/AdminScreen.vue'),
    children: [
      { path: '', component: () => import('pages/AdminMainPage.vue'), meta: { title: 'หน้าหลัก' } },
      { path: 'work', component: () => import('pages/AdminMainPage.vue'), meta: { title: 'งาน' } },
      {
        path: 'calendar',
        component: () => import('pages/AdminMainPage.vue'),
        meta: { title: 'ตารางงาน' },
      },
      {
        path: 'users',
        component: () => import('pages/AdminMainPage.vue'),
        meta: { title: 'จัดการผู้ใช้' },
      },
      {
        path: 'menu',
        component: () => import('pages/AdminMainPage.vue'),
        meta: { title: 'หมวดหมู่งาน' },
      },
      {
        path: 'report',
        component: () => import('pages/AdminMainPage.vue'),
        meta: { title: 'รายงาน' },
      },
      {
        path: 'settings',
        component: () => import('pages/AdminMainPage.vue'),
        meta: { title: 'ตั้งค่า' },
      },
    ],
  },

  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
