import { defineRouter } from '#q-app/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import routes from './routes';
import { useAuthStore } from 'src/stores/useAuth';

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

const roleHome: Record<string, string> = {
  admin: '/admin',
  inspector: '/inspector/Inspectsdashboard',
  customer: '/customer',
};

export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });
  // 🔐 Route Guard
  Router.beforeEach((to, from, next) => {
    const auth = useAuthStore();

    if (to.meta.publicLink) {
      next();
      return;
    }

    // login แล้วไม่ให้กลับมาหน้า /login — ส่งกลับหน้าหลักของ role ตัวเอง
    if (to.path === '/login' && auth.token) {
      const home = roleHome[auth.user?.role ?? ''];
      if (home) {
        next(home);
        return;
      }
    }

    const isAdminRoute = to.path.startsWith('/admin');
    const isInspectorRoute = to.path.startsWith('/inspector');
    const requiresAuth = to.meta.requiresAuth || isAdminRoute || isInspectorRoute;

    if (requiresAuth && !auth.token) {
      next('/login');
      return;
    }

    const role = auth.user?.role;

    if (isAdminRoute && role !== 'admin') {
      next(role === 'inspector' ? '/inspector/Inspectsdashboard' : '/login');
      return;
    }

    if (isInspectorRoute && role !== 'inspector') {
      next(role === 'admin' ? '/admin' : '/login');
      return;
    }

    next();
  });

  return Router;
});
