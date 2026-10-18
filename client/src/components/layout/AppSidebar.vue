<template>
  <aside 
    class="bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out fixed inset-y-0 left-0 z-50 w-64 md:relative md:translate-x-0"
    :class="isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'"
  >
    <div class="p-6 flex items-center justify-between">
      <AppLogo class="text-white" />
      <button 
        @click="$emit('closeMobileMenu')" 
        class="md:hidden text-slate-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md p-1"
        aria-label="Close sidebar"
      >
        <X class="w-5 h-5" />
      </button>
    </div>
    <nav class="flex-1 px-4 space-y-2 mt-2 overflow-y-auto">
      <router-link
        v-for="item in navItems"
        :key="item.name"
        :to="item.path"
        @click="closeMobileMenu"
        class="flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
        :class="[
          $route.path === item.path
            ? 'bg-indigo-600 text-white'
            : 'hover:bg-slate-800 hover:text-white'
        ]"
      >
        <component :is="item.icon" class="w-5 h-5 mr-3" />
        {{ item.name }}
      </router-link>
    </nav>
    <div class="p-4 border-t border-slate-800">
      <button type="button" @click="handleLogout" class="w-full flex items-center px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md">
        <LogOut class="w-4 h-4 mr-3" />
        Sign Out
      </button>
    </div>
  </aside>
</template>

<script>
import AppLogo from '../common/AppLogo.vue'
import { LayoutDashboard, Users, Receipt, Scale, MessageSquare, Bell, LogOut, X } from 'lucide-vue-next'
import { logout } from '../../services/authService'

export default {
  name: 'AppSidebar',
  components: {
    AppLogo,
    LayoutDashboard,
    Users,
    Receipt,
    Scale,
    MessageSquare,
    Bell,
    LogOut,
    X
  },
  props: {
    isMobileMenuOpen: {
      type: Boolean,
      default: false
    }
  },
  emits: ['closeMobileMenu'],
  data() {
    return {
      navItems: [
        { name: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
        { name: 'Groups', path: '/groups', icon: 'Users' },
        { name: 'Expenses', path: '/expenses', icon: 'Receipt' },
        { name: 'Balances', path: '/balances', icon: 'Scale' },
        { name: 'Chat', path: '/chat', icon: 'MessageSquare' },
        { name: 'Notifications', path: '/notifications', icon: 'Bell' }
      ]
    }
  },
  methods: {
    closeMobileMenu() {
      this.$emit('closeMobileMenu')
    },
    handleLogout() {
      logout()
      this.closeMobileMenu()
      this.$router.push('/login')
    }
  }
}
</script>
