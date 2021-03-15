import Vue from 'vue';
import Router from 'vue-router';
import Home from './views/home.vue';
import Account from './views/account.vue';
import Orgs from './views/org/orgs.vue';
import CreateOrg from './views/org/createOrg.vue';
import Redirecting from './views/redirecting.vue';
import Projects from './views/projects/projects.vue';
import { rocketChatRedirect, bothubRedirect, pushRedirect } from './utils/plugins/redirect';
import LuigiClient from '@luigi-project/client';

Vue.use(Router);

const router = new Router({
  routes: [
    {
      path: '/home',
      name: 'home',
      component: Home
    },
    {
      path: '/account',
      name: 'account',
      component: Account,
    },
    {
      path: '/orgs',
      name: 'orgs',
      component: Orgs,
    },
    {
      path: '/orgs/create',
      name: 'create_org',
      component: CreateOrg,
    },
    {
      path: '/projects',
      name: 'projects',
      component: Projects,
    },
    {
      path: '/rocket/',
      component: Redirecting,
      beforeEnter: (to, from, next) => {
        rocketChatRedirect();
        next();
      },
    },
    {
      path: '/bothub/',
      component: Redirecting,
      beforeEnter: (to, from, next) => {
        bothubRedirect();
        next();
      },
    },
    {
      path: '/push/',
      component: Redirecting,
      beforeEnter: (to, from, next) => {
        pushRedirect();
        next();
      },
    },
  ]
});

const themes = {
  'create_org': 'secondary',
  orgs: 'secondary',
  projects: 'secondary',
}

router.beforeEach((to, from, next) => {
  const theme = themes[to.name] || 'normal';
  LuigiClient.sendCustomMessage({id: 'change-theme', theme});
  next();
})


export default router;
