import { defineBoot } from '#q-app/wrappers';

// HIDS deliberately shows no toast notifications. The Notify plugin stays installed in
// quasar.config.ts so the ~130 existing $q.notify(...) call sites resolve to something
// callable instead of throwing; this replaces it with a no-op so nothing renders.
// Overriding Notify.create instead would NOT work: install() binds $q.notify to the
// original function, so reassigning Notify.create afterwards leaves $q.notify untouched.
// To bring toasts back: delete this file and its 'notify' entry in quasar.config.ts.
export default defineBoot(({ app }) => {
  const $q = app.config.globalProperties.$q;
  $q.notify = () => () => {};
});
