<template>
  <header class="bg-white h-16 border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10 w-full flex-shrink-0">
    <div class="flex items-center md:hidden">
      <button 
        @click="$emit('toggleMobileMenu')" 
        class="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md p-1"
        aria-label="Open mobile menu"
      >
        <Menu class="w-6 h-6" />
      </button>
      <AppLogo class="ml-4 scale-75 transform origin-left" />
    </div>
    <div class="hidden md:block">
      <!-- Empty space to maintain flex layout between elements if needed -->
    </div>
    <div class="flex items-center space-x-4">
      <router-link to="/notifications" class="text-gray-400 hover:text-gray-600 relative p-1" title="Notifications">
        <Bell class="w-5 h-5" />
        <span 
          v-if="unreadCount > 0" 
          class="absolute top-0 right-0 min-w-[16px] h-4 bg-indigo-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center px-1 transform translate-x-1 -translate-y-1 shadow-sm"
        >
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </router-link>
      <div class="flex items-center space-x-2 pl-2 border-l border-gray-100">
        <div class="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-sm">
          {{ userInitials }}
        </div>
        <span class="text-sm font-medium text-gray-700 hidden sm:block">{{ userName }}</span>
        <button @click="handleLogout" class="ml-3 text-xs font-semibold text-rose-500 hover:text-rose-700 bg-rose-50 px-2 py-1 rounded">Sign Out</button>
      </div>
    </div>
  </header>
</template>

<script>
import AppLogo from '../common/AppLogo.vue';
import { Menu, Bell } from 'lucide-vue-next';
import { getLocalUser, logout } from '../../services/authService';
import { getNotifications } from '../../services/notificationService';

export default {
  name: 'AppTopbar',
  components: {
    AppLogo,
    Menu,
    Bell
  },
  emits: ['toggleMobileMenu'],
  data() {
    return {
      unreadCount: 0
    };
  },
  computed: {
    userName() {
      const user = getLocalUser();
      return user ? user.name : 'Unknown';
    },
    userInitials() {
      const name = this.userName;
      if (name === 'Unknown') return '?';
      return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
  },
  watch: {
    '$route'() {
      this.fetchUnreadCount();
    }
  },
  mounted() {
    this.fetchUnreadCount();
  },
  methods: {
    async fetchUnreadCount() {
      try {
        const user = getLocalUser();
        if (!user) return;
        const data = await getNotifications();
        this.unreadCount = data?.unreadCount || 0;
      } catch (e) {
        // Silently catch in header
      }
    },
    handleLogout() {
      logout();
      this.$router.push('/login');
    }
  }
}
</script>
