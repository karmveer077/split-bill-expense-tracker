<template>
  <div class="flex flex-col space-y-6">
    <PageHeader 
      title="Group Chat" 
      description="Communicate with your group members in real-time conversations" 
      class="mb-0 flex-shrink-0"
    />
    
    <!-- Loading state for initial groups fetch -->
    <div v-if="isLoadingGroups" class="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500">
      <RefreshCw class="w-8 h-8 mx-auto animate-spin text-indigo-600 mb-3" />
      <p class="text-sm">Loading your groups...</p>
    </div>

    <!-- Empty state: no groups -->
    <div v-else-if="groups.length === 0" class="bg-white border border-gray-200 rounded-xl p-12 text-center">
      <div class="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <MessageSquare class="w-6 h-6" />
      </div>
      <h3 class="text-base font-semibold text-gray-900 mb-1">No Groups Found</h3>
      <p class="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
        You need to be part of a group to participate in chat discussions.
      </p>
      <router-link
        to="/groups"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
      >
        Go to Groups
      </router-link>
    </div>

    <!-- Main Chat Workspace -->
    <div v-else class="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col md:flex-row overflow-hidden min-h-[560px]">
      <!-- Groups Sidebar -->
      <div class="w-full md:w-72 border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50 flex flex-col flex-shrink-0">
        <div class="p-4 border-b border-gray-200 font-semibold text-gray-700 flex items-center justify-between">
          <span>Your Groups</span>
          <span class="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-medium">{{ groups.length }}</span>
        </div>
        <div class="p-3 flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible md:overflow-y-auto max-h-[140px] md:max-h-none flex-1">
          <button 
            v-for="grp in groups" 
            :key="grp.id"
            @click="selectGroup(grp.id)"
            :class="[
              'flex-shrink-0 md:w-full text-left px-4 py-3 rounded-lg font-medium text-sm transition-colors flex items-center justify-between',
              selectedGroupId === grp.id 
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm' 
                : 'hover:bg-gray-100 text-gray-700 border border-transparent'
            ]"
          >
            <div class="truncate mr-2">
              <p class="font-semibold truncate">{{ grp.name }}</p>
              <p class="text-xs text-gray-500 truncate">{{ grp.members?.length || grp.memberCount || 1 }} members</p>
            </div>
          </button>
        </div>
      </div>
      
      <!-- Chat Main Column -->
      <div class="flex-1 flex flex-col bg-slate-50 min-h-[460px]">
        <!-- Chat Header -->
        <div class="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
          <div>
            <h2 class="font-semibold text-gray-900 text-base">{{ currentGroup?.name || 'Group Chat' }}</h2>
            <p class="text-xs text-gray-500">{{ currentGroup?.description || 'Group conversation' }}</p>
          </div>
          
          <button 
            @click="refreshMessages" 
            :disabled="isLoadingMessages"
            class="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
            title="Check for new messages"
          >
            <RefreshCw :class="['w-3.5 h-3.5 mr-1.5', isLoadingMessages ? 'animate-spin text-indigo-600' : 'text-gray-500']" />
            <span>Refresh Messages</span>
          </button>
        </div>

        <!-- Alert Notification for errors -->
        <div v-if="errorMessage" class="p-3 bg-red-50 border-b border-red-200 text-red-700 text-xs flex justify-between items-center">
          <span>{{ errorMessage }}</span>
          <button @click="errorMessage = ''" class="text-red-500 hover:text-red-700 font-bold">&times;</button>
        </div>

        <!-- Messages scroll container -->
        <div ref="messagesContainer" class="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[420px]">
          <!-- Loading messages placeholder -->
          <div v-if="isLoadingMessages && messages.length === 0" class="text-center py-12 text-gray-400">
            <RefreshCw class="w-6 h-6 mx-auto animate-spin mb-2 text-indigo-500" />
            <p class="text-xs">Loading conversation history...</p>
          </div>

          <!-- Empty messages placeholder -->
          <div v-else-if="messages.length === 0" class="text-center py-12 text-gray-400">
            <MessageSquare class="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p class="text-sm font-medium text-gray-600">No messages yet in this group</p>
            <p class="text-xs text-gray-400 mt-1">Start the conversation by sending a message below.</p>
          </div>

          <!-- Messages stream -->
          <div 
            v-for="msg in messages" 
            :key="msg.id"
            :class="['flex', isCurrentUser(msg.senderId) ? 'justify-end' : 'justify-start']"
          >
            <!-- Current user's bubble (Right) -->
            <div 
              v-if="isCurrentUser(msg.senderId)" 
              class="max-w-[85%] sm:max-w-md bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm text-sm"
            >
              <p class="whitespace-pre-wrap break-words">{{ msg.content }}</p>
              <p class="text-[10px] text-indigo-200 mt-1 text-right">{{ formatTimestamp(msg.createdAt) }}</p>
            </div>

            <!-- Other member's bubble (Left) -->
            <div v-else class="flex items-end space-x-2 max-w-[85%] sm:max-w-md">
              <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {{ getInitials(msg.senderName) }}
              </div>
              <div class="bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm text-sm">
                <p class="text-[11px] font-semibold text-indigo-600 mb-1">{{ msg.senderName }}</p>
                <p class="whitespace-pre-wrap break-words">{{ msg.content }}</p>
                <p class="text-[10px] text-gray-400 mt-1 text-left">{{ formatTimestamp(msg.createdAt) }}</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Input area -->
        <div class="p-3 sm:p-4 border-t border-gray-200 bg-white">
          <form @submit.prevent="handleSendMessage" class="flex flex-col space-y-2">
            <div class="flex items-end space-x-2">
              <textarea 
                v-model="newMessage" 
                rows="1"
                maxlength="1000"
                placeholder="Type your message..." 
                :disabled="isSending"
                @keydown.enter.exact.prevent="handleSendMessage"
                class="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 disabled:opacity-50"
              ></textarea>
              
              <button 
                type="submit"
                :disabled="!newMessage.trim() || isSending"
                class="w-10 h-10 flex-shrink-0 rounded-xl bg-indigo-600 text-white flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Send message"
              >
                <Send v-if="!isSending" class="w-4 h-4 ml-0.5" />
                <RefreshCw v-else class="w-4 h-4 animate-spin" />
              </button>
            </div>
            
            <div class="flex justify-between items-center text-[11px] text-gray-400 px-1">
              <span>Press Enter to send</span>
              <span :class="{ 'text-red-500 font-semibold': newMessage.length >= 950 }">
                {{ newMessage.length }} / 1000
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import PageHeader from '../components/common/PageHeader.vue';
import { Send, RefreshCw, MessageSquare } from 'lucide-vue-next';
import { getGroups } from '../services/groupService';
import { getGroupMessages, sendGroupMessage } from '../services/messageService';
import { getLocalUser } from '../services/authService';

export default {
  name: 'Chat',
  components: {
    PageHeader,
    Send,
    RefreshCw,
    MessageSquare
  },
  data() {
    return {
      groups: [],
      selectedGroupId: null,
      messages: [],
      newMessage: '',
      isLoadingGroups: true,
      isLoadingMessages: false,
      isSending: false,
      errorMessage: '',
      currentUser: null
    };
  },
  computed: {
    currentGroup() {
      return this.groups.find(g => g.id === this.selectedGroupId) || null;
    }
  },
  async mounted() {
    this.currentUser = getLocalUser();
    await this.loadGroups();
  },
  methods: {
    async loadGroups() {
      this.isLoadingGroups = true;
      this.errorMessage = '';
      try {
        const data = await getGroups();
        this.groups = data || [];
        if (this.groups.length > 0) {
          this.selectedGroupId = this.groups[0].id;
          await this.loadMessages(this.selectedGroupId);
        }
      } catch (err) {
        this.errorMessage = err.message || 'Failed to load groups.';
      } finally {
        this.isLoadingGroups = false;
      }
    },
    async selectGroup(groupId) {
      if (this.selectedGroupId === groupId) return;
      this.selectedGroupId = groupId;
      this.newMessage = '';
      this.errorMessage = '';
      await this.loadMessages(groupId);
    },
    async loadMessages(groupId) {
      if (!groupId) return;
      this.isLoadingMessages = true;
      try {
        const msgs = await getGroupMessages(groupId);
        this.messages = msgs || [];
        this.scrollToBottom();
      } catch (err) {
        this.errorMessage = err.message || 'Failed to load messages.';
      } finally {
        this.isLoadingMessages = false;
      }
    },
    async refreshMessages() {
      if (!this.selectedGroupId) return;
      await this.loadMessages(this.selectedGroupId);
    },
    async handleSendMessage() {
      const trimmed = this.newMessage.trim();
      if (!trimmed || !this.selectedGroupId || this.isSending) return;

      this.isSending = true;
      this.errorMessage = '';
      try {
        const created = await sendGroupMessage(this.selectedGroupId, trimmed);
        this.newMessage = '';
        this.messages.push(created);
        this.scrollToBottom();
      } catch (err) {
        this.errorMessage = err.message || 'Failed to send message.';
      } finally {
        this.isSending = false;
      }
    },
    isCurrentUser(senderId) {
      if (!this.currentUser) return false;
      return Number(senderId) === Number(this.currentUser.id);
    },
    getInitials(name) {
      if (!name) return '?';
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    },
    formatTimestamp(ts) {
      if (!ts) return '';
      try {
        const date = new Date(ts);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch (e) {
        return '';
      }
    },
    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.messagesContainer;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
    }
  }
};
</script>
