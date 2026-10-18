import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Login from '../views/Login.vue'
import Signup from '../views/Signup.vue'
import Groups from '../views/Groups.vue'
import Expenses from '../views/Expenses.vue'
import Balances from '../views/Balances.vue'
import Chat from '../views/Chat.vue'
import Notifications from '../views/Notifications.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'Login', component: Login, meta: { public: true } },
  { path: '/signup', name: 'Signup', component: Signup, meta: { public: true } },
  { path: '/dashboard', name: 'Dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/groups', name: 'Groups', component: Groups, meta: { requiresAuth: true } },
  { path: '/expenses', name: 'Expenses', component: Expenses, meta: { requiresAuth: true } },
  { path: '/balances', name: 'Balances', component: Balances, meta: { requiresAuth: true } },
  { path: '/chat', name: 'Chat', component: Chat, meta: { requiresAuth: true } },
  { path: '/notifications', name: 'Notifications', component: Notifications, meta: { requiresAuth: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token');
    if (to.meta.requiresAuth && !token) {
        next('/login');
    } else if (to.meta.public && token) {
        next('/dashboard');
    } else {
        next();
    }
});

export default router
