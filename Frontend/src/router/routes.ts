import type { RouteRecordRaw } from 'vue-router';
import { useAuthStore } from 'src/stores/useAuth';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: () => {
      const auth = useAuthStore();

      if (!auth.token) return '/login';

      switch (auth.user?.role) {
        case 'admin':
          return '/admin';
        case 'inspector':
          return '/inspector/Inspectsdashboard';
        case 'customer':
          return '/customer';
        default:
          return '/login';
      }
    },
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
      { path: '', component: () => import('pages/CustomerMainPage.vue'), meta: { icon: 'home' } },
      {
        path: 'defect',
        name: 'defectList',
        component: () => import('pages/CustomerDefectListPage.vue'),
        meta: { title: 'nav.customer.titleDefectList', icon: 'assignment' },
      },
      {
        path: 'report',
        name: 'reportList',
        component: () => import('pages/CustomerReportPage.vue'),
        meta: { title: 'nav.customer.titleReportList', icon: 'bar_chart' },
      },
      {
        path: 'defect-detail/:id',
        name: 'customerDefectDetail',
        component: () => import('pages/ContractorUpdateRepairPage.vue'),
        meta: { title: 'nav.customer.titleDefectDetail' },
      },
    ],
  },
  {
    path: '/view/:slug',
    component: () => import('layouts/FullScreen.vue'),
    meta: { publicLink: true },
    children: [
      {
        path: '',
        component: () => import('pages/PublicLinkEntryPage.vue'),
        props: {
          expectedRole: 'customer',
          redirectPath: '/customer',
        },
      },
    ],
  },
  {
    path: '/fix/:slug',
    component: () => import('layouts/FullScreen.vue'),
    meta: { publicLink: true },
    children: [
      {
        path: '',
        component: () => import('pages/PublicLinkEntryPage.vue'),
        props: {
          expectedRole: 'contractor',
          redirectPath: '/contractor/defect-list',
        },
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
        meta: { title: 'nav.admin.titleDashboard', icon: 'home' },
      },
      {
        path: 'work',
        component: () => import('pages/AdminWorkListPage.vue'),
        meta: { title: 'nav.admin.titleWork', icon: 'business_center' },
      },

      {
        path: 'profile',
        component: () => import('pages/AdminProfilePage.vue'),
        meta: { title: 'nav.admin.titleProfile', icon: 'person' },
      },
      {
        path: 'users',
        component: () => import('pages/AdminUserManagementPage.vue'),
        meta: { title: 'nav.admin.titleUsers', icon: 'group' },
      },
      {
        path: 'teams',
        component: () => import('pages/AdminTeamManagementPage.vue'),
        meta: { title: 'nav.admin.titleTeams', icon: 'groups' },
      },
      {
        path: 'master-data',
        component: () => import('pages/admin/MasterDataPage.vue'),
        meta: { title: 'nav.admin.titleMasterData', icon: 'dashboard_customize' },
      },
      {
        path: 'branches',
        redirect: '/admin/teams',
        meta: { title: 'บริษัท / สาขา', icon: 'business' },
      },
      {
        meta: { title: 'จัดการทีม', icon: 'groups' },
        path: 'teams-legacy',
        redirect: '/admin/teams',
      },
      {
        path: 'menu',
        component: () => import('pages/AdminMainPage.vue'),
        meta: { title: 'nav.admin.titleMenu', icon: 'category' },
      },
      {
        path: 'dashboard',
        component: () => import('pages/AdminDashboardPage.vue'),
        meta: { title: 'nav.admin.titleBusinessDashboard', icon: 'bar_chart' },
      },
      // {
      //   path: 'settings',
      //   component: () => import('pages/AdminMainPage.vue'),
      //   meta: { title: 'nav.admin.titleSettings', icon: 'settings' },
      // },
    ],
  },
  {
    path: '/admin/notifications',
    component: () => import('layouts/FullScreen.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/AdminNotificationsPage.vue'),
        meta: { title: 'nav.admin.titleNotifications', icon: 'notifications' },
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
    path: '/admin/work/ins/:id',
    component: () => import('layouts/FullScreen.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/AdminJobInsDetailPage.vue'),
      },
    ],
  },
  {
    path: '/admin/work/cons/:id',
    component: () => import('layouts/FullScreen.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/AdminJobConsDetailPage.vue'),
      },
    ],
  },
  {
    path: '/admin/report/:roundId',
    component: () => import('layouts/AdminInspectionScreen.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/InspectionReportPage.vue'),
      },
    ],
  },
  {
    path: '/admin/construction-inspect/:roundId',
    component: () => import('layouts/FullScreen.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/ConstructionInspectPage.vue'),
      },
    ],
  },
  {
    // แอดมินใช้หน้าตรวจชุดเดียวกับ inspector เพื่อแก้ defect ของรอบที่ยื่นอนุมัติมาแล้ว
    // (inspector แก้ไม่ได้ตอน SUBMITTED แล้ว — ดู useRoundLock) แยก route ไว้ไม่ให้หลุดเข้า shell ของ inspector
    path: '/admin/inspection/:roundId',
    component: () => import('layouts/AdminInspectionScreen.vue'),
    children: [
      {
        path: '',
        name: 'adminInspection',
        component: () => import('pages/InspectionPage.vue'),
      },
      {
        path: 'room-defect',
        name: 'adminRoomDefect',
        component: () => import('pages/RoomDefectPage.vue'),
      },
      {
        path: 'add-defect',
        name: 'adminAddDefect',
        component: () => import('pages/AddDefectPage.vue'),
      },
      {
        path: 'verify-defect',
        name: 'adminVerifyDefect',
        component: () => import('pages/VerifyDefectPage.vue'),
      },
    ],
  },
  {
    path: '/inspector',
    component: () => import('layouts/InspectorScreen.vue'),
    redirect: '/inspector/Inspectsdashboard',
    children: [
      {
        path: 'Inspectsdashboard',
        component: () => import('pages/InspectorDashboardPage.vue'),
        meta: { title: 'การตรวจบ้าน', icon: 'search' },
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
        path: 'job/:roundId/inspection/verify-defect',
        name: 'verifyDefect',
        component: () => import('pages/VerifyDefectPage.vue'),
      },
      {
        path: 'Consdashboard',
        component: () => import('pages/ConstructorDashboardPage.vue'),
        meta: { title: 'ตรวจก่อสร้าง', icon: 'construction' },
      },
    ],
  },
  {
    // route แยกต่างหาก ไม่ซ้อนใน InspectorScreen.vue เพราะหน้านี้มี q-layout/q-header เป็นของตัวเองอยู่แล้ว
    // (ซ้อนกันจะทำให้ header ของ InspectorScreen ทับกับ header ของหน้านี้)
    path: '/inspector/profile',
    component: () => import('layouts/FullScreen.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/InspectorProfilePage.vue'),
      },
    ],
  },
  {
    path: '/inspector/notifications',
    component: () => import('layouts/FullScreen.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/InspectorNotificationsPage.vue'),
      },
      {
        path: 'notifications',
        component: () => import('pages/InspectorNotificationsPage.vue'),
        meta: { title: 'การแจ้งเตือน' },
      },
      {
        path: 'profile',
        component: () => import('pages/InspectorProfilePage.vue'),
        meta: { title: 'โปรไฟล์' },
      },
    ],
  },

  {
  path: '/contractor',
  component: () => import('layouts/ContractorScreen.vue'),
  redirect: '/contractor/defect-list',
  children: [
    { path: 'repair-overview', component: () => import('pages/ContractorMainPage.vue'),           meta: { title: 'nav.contractor.titleRepairOverview', icon: 'home_repair_service' } },
    { path: 'defect-list',     component: () => import('pages/ContractorRepairDefectListPage.vue'),          meta: { title: 'nav.contractor.titleDefectList', icon: 'assignment' } },
    { path: 'defect-list/:id', component: () => import('pages/ContractorRepairDefectListPage.vue'),          meta: { title: 'nav.contractor.titleDefectList', icon: 'assignment' } },
    { path: 'defect-detail/:id', component: () => import('pages/ContractorUpdateRepairPage.vue'), meta: { title: 'nav.contractor.titleDefectDetail' } },
  ],
  meta: { requiresAuth: false },
},

  {
    // route headless สำหรับ Puppeteer เท่านั้น (backend/src/reports/reports.service.ts) — ไม่มี layout/UI รอบข้าง
    path: '/print/report/:roundId',
    component: () => import('pages/PrintDefectReportPage.vue'),
  },
  {
    path: '/:catchAll(.*)*',
    redirect: '/',
  },
];

export default routes;
