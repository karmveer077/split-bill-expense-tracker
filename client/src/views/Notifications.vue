<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <PageHeader 
        title="Notifications" 
        description="Stay updated on recent expenses, settlements, and group activity" 
        class="mb-0"
      />

      <div class="flex items-center space-x-3 flex-shrink-0">
        <button 
          v-if="unreadCount > 0"
          @click="handleMarkAllRead" 
          :disabled="isMarkingAll"
          class="inline-flex items-center px-4 py-2 border border-gray-300 text-xs font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-colors disabled:opacity-50"
        >
          <CheckCheck class="w-4 h-4 mr-1.5 text-indigo-600" />
          <span>{{ isMarkingAll ? 'Marking...' : 'Mark all as read' }}</span>
        </button>

        <button 
          @click="loadNotifications" 
          :disabled="isLoading"
          class="inline-flex items-center p-2 border border-gray-300 text-xs font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-colors disabled:opacity-50"
          title="Refresh notifications"
        >
          <RefreshCw :class="['w-4 h-4', isLoading ? 'animate-spin text-indigo-600' : 'text-gray-500']" />
        </button>
      </div>
    </div>

    <!-- Error Banner -->
    <div v-if="errorMessage" class="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex justify-between items-center">
      <span>{{ errorMessage }}</span>
      <button @click="errorMessage = ''" class="text-red-500 hover:text-red-700 font-bold text-base">&times;</button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && notifications.length === 0" class="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500">
      <RefreshCw class="w-8 h-8 mx-auto animate-spin text-indigo-600 mb-3" />
      <p class="text-sm">Loading your notifications...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="notifications.length === 0" class="bg-white border border-gray-200 rounded-xl p-12 text-center">
      <div class="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <Bell class="w-6 h-6" />
      </div>
      <h3 class="text-base font-semibold text-gray-900 mb-1">No Notifications Yet</h3>
      <p class="text-sm text-gray-500 max-w-sm mx-auto">
        You're all caught up! New expenses, settlements, and group messages will appear here.
      </p>
    </div>

    <!-- Notifications List -->
    <div v-else class="max-w-3xl space-y-3">
      <div 
        v-for="notification in notifications" 
        :key="notification.id" 
        class="bg-white p-4 rounded-xl border shadow-sm flex items-start space-x-4 transition-all"
        :class="!notification.isRead ? 'border-indigo-200 bg-indigo-50/15 ring-1 ring-indigo-100' : 'border-gray-200'"
      >
        <!-- Icon based on notification type -->
        <div 
          class="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center"
          :class="getIconContainerClass(notification.type, notification.isRead)"
        >
          <component :is="getIconComponent(notification.type)" class="w-5 h-5" />
        </div>

        <!-- Body content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center space-x-2 mb-1">
            <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700">
              {{ notification.groupName }}
            </span>
            <span v-if="!notification.isRead" class="inline-block w-2 h-2 rounded-full bg-indigo-600" title="Unread"></span>
          </div>

          <p class="text-sm font-medium" :class="!notification.isRead ? 'text-gray-900' : 'text-gray-600'">
            {{ notification.message }}
          </p>
          
          <p class="text-xs mt-1" :class="!notification.isRead ? 'text-indigo-600 font-medium' : 'text-gray-400'">
            {{ formatTimestamp(notification.createdAt) }}
          </p>
        </div>

        <!-- Read Action Button -->
        <div class="flex-shrink-0 self-center">
          <button 
            v-if="!notification.isRead"
            @click="handleMarkRead(notification)"
            class="text-xs font-semibold px-3 py-1.5 rounded-lg text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 border border-indigo-200 focus:outline-none transition-colors"
            title="Mark as read"
          >
            Mark Read
          </button>
          <span v-else class="text-xs text-gray-400 font-medium px-2 py-1 flex items-center">
            <Check class="w-3.5 h-3.5 mr-1 text-gray-400" /> Read
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import PageHeader from '../components/common/PageHeader.vue';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  RefreshCw, 
  Receipt, 
  CreditCard, 
  UserPlus, 
  MessageSquare,
  AlertCircle
} from 'lucide-vue-next';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../services/notificationService';

export default {
  name: 'Notifications',
  components: {
    PageHeader,
    Bell,
    Check,
    CheckCheck,
    RefreshCw,
    Receipt,
    CreditCard,
    UserPlus,
    MessageSquare,
    AlertCircle
  },
  data() {
    return {
      notifications: [],
      unreadCount: 0,
      isLoading: true,
      isMarkingAll: false,
      errorMessage: ''
    };
  },
  async mounted() {
    await this.loadNotifications();
  },
  methods: {
    async loadNotifications() {
      this.isLoading = true;
      this.errorMessage = '';
      try {
        const data = await getNotifications();
        this.notifications = data.notifications || [];
        this.unreadCount = data.unreadCount || 0;
      } catch (err) {
        this.errorMessage = err.message || 'Failed to load notifications.';
      } finally {
        this.isLoading = false;
      }
    },
    async handleMarkRead(notif) {
      try {
        await markNotificationRead(notif.id);
        notif.isRead = 1;
        if (this.unreadCount > 0) this.unreadCount--;
      } catch (err) {
        this.errorMessage = err.message || 'Failed to mark notification as read.';
      }
    },
    async handleMarkAllRead() {
      this.isMarkingAll = true;
      try {
        await markAllNotificationsRead();
        this.notifications.forEach(n => { n.isRead = 1; });
        this.unreadCount = 0;
      } catch (err) {
        this.errorMessage = err.message || 'Failed to mark all as read.';
      } finally {
        this.isMarkingAll = false;
      }
    },
    getIconComponent(type) {
      switch (type) {
        case 'expense_added':
        case 'expense_updated':
        case 'expense_deleted':
          return 'Receipt';
        case 'settlement_recorded':
          return 'CreditCard';
        case 'group_joined':
          return 'UserPlus';
        case 'new_message':
          return 'MessageSquare';
        default:
          return 'Bell';
      }
    },
    getIconContainerClass(type, isRead) {
      if (isRead) {
        return 'bg-gray-100 text-gray-500';
      }
      switch (type) {
        case 'expense_added':
          return 'bg-emerald-100 text-emerald-700';
        case 'expense_updated':
          return 'bg-amber-100 text-amber-700';
        case 'expense_deleted':
          return 'bg-rose-100 text-rose-700';
        case 'settlement_recorded':
          return 'bg-blue-100 text-blue-700';
        case 'group_joined':
          return 'bg-purple-100 text-purple-700';
        case 'new_message':
          return 'bg-indigo-100 text-indigo-700';
        default:
          return 'bg-indigo-100 text-indigo-700';
      }
    },
    formatTimestamp(ts) {
      if (!ts) return '';
      try {
        const d = new Date(ts);
        return d.toLocaleString([], { 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      } catch (e) {
        return '';
      }
    }
  }
};
</script>
