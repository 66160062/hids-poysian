import type { MessageSchema } from '../en-US';
import language from './language';
import common from './common';
import nav from './nav';
import login from './login';
import adminJobs from './adminJobs';
import adminWork from './adminWork';
import adminManage from './adminManage';
import inspector from './inspector';
import inspection from './inspection';
import construction from './construction';
import customer from './customer';
import contractor from './contractor';
import components from './components';
import reports from './reports';
import stores from './stores';

export default {
  language,
  common,
  nav,
  login,
  adminJobs,
  adminWork,
  adminManage,
  inspector,
  inspection,
  construction,
  customer,
  contractor,
  components,
  reports,
  stores,
} satisfies MessageSchema;
