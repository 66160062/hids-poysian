import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login',
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
  {
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
      {
        path: '',
        component: () => import('pages/AdminMainPage.vue'),
        meta: { title: 'หน้าหลัก', icon: 'home' },
      },
      {
        path: 'work',
        component: () => import('pages/AdminWorkListPage.vue'),
        meta: { title: 'จัดการงานตรวจ', icon: 'business_center' },
      },

      {
        path: 'profile',
        component: () => import('pages/AdminProfilePage.vue'),
        meta: { title: 'โปรไฟล์', icon: 'person' },
      },
      {
        path: 'notifications',
        component: () => import('pages/AdminNotificationsPage.vue'),
        meta: { title: 'การแจ้งเตือน', icon: 'notifications' },
      },
      {
        path: 'users',
        component: () => import('pages/AdminUserManagementPage.vue'),
        meta: { title: 'จัดการผู้ใช้', icon: 'group' },
      },
      {
        path: 'menu',
        component: () => import('pages/AdminMainPage.vue'),
        meta: { title: 'หมวดหมู่งาน', icon: 'category' },
      },
      {
        path: 'report',
        component: () => import('pages/AdminMainPage.vue'),
        meta: { title: 'รายงาน', icon: 'bar_chart' },
      },
      {
        path: 'settings',
        component: () => import('pages/AdminMainPage.vue'),
        meta: { title: 'ตั้งค่า', icon: 'settings' },
      },
    ],
  },
  {
    path: '/admin/work/create',
    component: () => import('layouts/FullScreen.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/AdminCreateJobPage.vue'),
      },
    ],
  },
  {
    path: '/admin/work/:id',
    component: () => import('layouts/FullScreen.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/AdminJobDetailPage.vue'),
      },
    ],
  },
  {
    path: '/inspector',
    component: () => import('layouts/InspectorScreen.vue'),
    children: [
      {
        path: 'Inspectsdashboard',
        component: () => import('pages/InspectorDashboardPage.vue'),
        meta: { title: 'การตรวจบ้าน' },
      },
      {
        path: 'job/:roundId',
        component: () => import('pages/InspectorDetailPage.vue'),
        meta: { title: 'รายละเอียดงานตรวจ' },
      },
      {
        path: 'job/:roundId/inspection',
        component: () => import('pages/InspectionPage.vue'),
        meta: { title: 'การตรวจ' },
      },
      {
        path: 'job/:roundId/construction-inspect',
        name: 'constructionInspect',
        component: () => import('pages/ConstructionInspectPage.vue'),
        meta: { title: 'ตรวจก่อสร้าง' },
      },
      {
        path: 'job/:roundId/report',
        component: () => import('pages/InspectionReportPage.vue'),
        meta: { title: 'รายงาน' },
      },
      {
        path: 'job/:roundId/inspection/room-defect',
        name: 'roomDefect',
        component: () => import('pages/RoomDefectPage.vue'),
      },
      {
        path: 'job/:roundId/inspection/add-defect',
        name: 'addDefect',
        component: () => import('pages/AddDefectPage.vue'),
      },
      {
        path: 'Consdashboard',
        component: () => import('pages/ConstructionPage.vue'),
        meta: { title: 'ตรวจก่อสร้าง' },
      },
    ],
  },

  {
  path: '/contractor',
  component: () => import('layouts/ContractorScreen.vue'),
  redirect: '/contractor/repair-overview',
  children: [
    { path: 'repair-overview', component: () => import('pages/ContractorMainPage.vue'),           meta: { title: 'จุดที่ต้องแก้ไข' } },
    { path: 'defect-list',     component: () => import('pages/ContractorRepairDefectListPage.vue'),          meta: { title: 'รายการ Defect' } },
    { path: 'defect-list/:id', component: () => import('pages/ContractorRepairDefectListPage.vue'),          meta: { title: 'รายการ Defect' } },
    { path: 'defect-detail/:id', component: () => import('pages/ContractorUpdateRepairPage.vue'), meta: { title: 'อัพเดตสถานะซ่อม' } },
  ],
  meta: { requiresAuth: false },
},

  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
