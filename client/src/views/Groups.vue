<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 mb-6">
      <PageHeader 
        title="Groups" 
        description="Manage your expense sharing groups" 
        class="mb-0"
      />
      <div class="flex space-x-3 w-full sm:w-auto">
         <BaseButton @click="openJoinModal" variant="outline" class="flex items-center flex-1 sm:flex-none justify-center">
           Join Group
         </BaseButton>
         <BaseButton @click="openGroupModal()" class="flex items-center flex-1 sm:flex-none justify-center">
           <Plus class="w-4 h-4 mr-2" />
           Create Group
         </BaseButton>
      </div>
    </div>
    
    <div v-if="globalError" class="p-4 bg-red-50 text-red-700 rounded-md mb-6 border border-red-100">
       {{ globalError }}
    </div>

    <!-- Groups Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-if="isLoading" class="col-span-full py-8 text-center text-gray-500">Loading groups...</div>
      
      <div v-else-if="groups.length === 0" class="col-span-full py-8 text-center text-gray-500">
         You haven't joined any groups yet.
      </div>

      <div v-for="group in groups" :key="group.id" class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
        <div>
          <div class="flex justify-between items-start mb-4">
            <div class="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users class="w-6 h-6" />
            </div>
            <span class="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
              {{ group.memberCount }} Members
            </span>
          </div>
          <div class="flex justify-between items-start">
             <h3 class="text-lg font-bold text-gray-900 truncate pr-2">{{ group.name }}</h3>
             <!-- Edit only if creator -->
             <button v-if="group.createdById === currentUserId" @click="openGroupModal(group)" class="text-xs text-indigo-600 hover:text-indigo-800">Edit</button>
          </div>
          <p v-if="group.description" class="text-sm text-gray-500 mt-1 line-clamp-2">{{ group.description }}</p>
          
          <p class="text-sm text-gray-900 font-medium mt-3 mb-4">Total Expenses: ₹{{ formatCurrencyVal(group.totalExpensePaise) }}</p>
          
          <!-- Invite Code -->
          <div class="bg-gray-50 p-2 text-center rounded border border-dashed border-gray-300 mb-4">
             <p class="text-xs text-gray-500 uppercase font-semibold">Invite Code</p>
             <p class="font-mono text-sm tracking-widest font-bold text-indigo-700">{{ group.inviteCode }}</p>
          </div>

          <!-- Members List -->
          <div class="mt-2 mb-4">
            <h4 class="text-xs font-semibold text-gray-500 uppercase mb-2">Members</h4>
            <div class="flex flex-wrap gap-2">
              <span v-for="m in group.members" :key="m.id" class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                {{ m.name }}
              </span>
            </div>
          </div>
        </div>

        <!-- Activity Feed Action -->
        <div class="pt-3 border-t border-gray-100 flex items-center justify-between">
          <button 
            @click="openActivityModal(group)"
            class="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
          >
            <Activity class="w-3.5 h-3.5 mr-1" />
            View Activity
          </button>

          <router-link 
            to="/chat" 
            class="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-gray-700"
          >
            <MessageSquare class="w-3.5 h-3.5 mr-1" />
            Chat
          </router-link>
        </div>
      </div>
    </div>

    <!-- Create/Edit Group Modal -->
    <AppModal 
      :isOpen="isModalOpen" 
      :title="editGroupId ? 'Edit Group' : 'Create New Group'" 
      @close="closeGroupModal"
    >
      <form class="space-y-4" @submit.prevent="handleSaveGroup">
        <FormField 
          id="group-name" 
          label="Group Name *" 
          v-model="newGroupName"
          :error="modalError"
          placeholder="e.g. Goa Trip 2026" 
        />
        <FormField 
          id="group-desc" 
          label="Description (Optional)" 
          v-model="newGroupDesc"
          placeholder="e.g. Trip expenses" 
        />
        
        <div class="pt-4 border-t border-gray-100 flex justify-end space-x-3 mt-6">
          <BaseButton @click="closeGroupModal" variant="ghost" type="button" :disabled="isSaving">Cancel</BaseButton>
          <BaseButton type="submit" :disabled="isSaving">{{ isSaving ? 'Saving...' : 'Save Group' }}</BaseButton>
        </div>
      </form>
    </AppModal>

    <!-- Join Group Modal -->
    <AppModal 
      :isOpen="isJoinModalOpen" 
      title="Join a Group" 
      @close="closeJoinModal"
    >
      <form class="space-y-4" @submit.prevent="handleJoinGroup">
        <FormField 
          id="invite-code" 
          label="Invite Code *" 
          v-model="inviteCodeToJoin"
          :error="joinModalError"
          placeholder="Enter the 6-8 digit code" 
        />
        
        <div class="pt-4 border-t border-gray-100 flex justify-end space-x-3 mt-6">
          <BaseButton @click="closeJoinModal" variant="ghost" type="button" :disabled="isSaving">Cancel</BaseButton>
          <BaseButton type="submit" :disabled="isSaving">{{ isSaving ? 'Joining...' : 'Join' }}</BaseButton>
        </div>
      </form>
    </AppModal>

    <!-- Group Activity Modal -->
    <AppModal
      :isOpen="isActivityModalOpen"
      :title="selectedActivityGroup ? `${selectedActivityGroup.name} — Activity Feed` : 'Group Activity'"
      @close="closeActivityModal"
    >
      <div class="space-y-4">
        <!-- Loading -->
        <div v-if="isLoadingActivity" class="py-8 text-center text-gray-400">
          <RefreshCw class="w-6 h-6 mx-auto animate-spin mb-2 text-indigo-600" />
          <p class="text-xs">Loading activity logs...</p>
        </div>

        <!-- Error -->
        <div v-else-if="activityError" class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
          {{ activityError }}
        </div>

        <!-- Empty -->
        <div v-else-if="activityLogs.length === 0" class="py-8 text-center text-gray-400">
          <Activity class="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p class="text-sm font-medium text-gray-600">No activity recorded yet</p>
          <p class="text-xs text-gray-400 mt-1">Actions such as creating expenses, settling balances, or new members joining will appear here.</p>
        </div>

        <!-- Activity Timeline -->
        <div v-else class="space-y-3 max-h-[360px] overflow-y-auto pr-1">
          <div 
            v-for="item in activityLogs" 
            :key="item.id"
            class="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 border border-gray-100"
          >
            <div class="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
              {{ getInitials(item.actorName) }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs text-gray-800 font-medium leading-relaxed">
                {{ item.description }}
              </p>
              <p class="text-[10px] text-gray-400 mt-1">
                {{ formatTimestamp(item.createdAt) }}
              </p>
            </div>
          </div>
        </div>

        <div class="pt-4 border-t border-gray-100 flex justify-end">
          <BaseButton @click="closeActivityModal" variant="outline" size="sm">Close</BaseButton>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script>
import PageHeader from '../components/common/PageHeader.vue';
import BaseButton from '../components/common/BaseButton.vue';
import AppModal from '../components/common/AppModal.vue';
import FormField from '../components/common/FormField.vue';
import { Plus, Users, Activity, MessageSquare, RefreshCw } from 'lucide-vue-next';
import { getGroups, createGroup, updateGroup, joinGroup } from '../services/groupService';
import { getGroupActivity } from '../services/activityService';
import { getLocalUser } from '../services/authService';
import { formatCurrency } from '../utils/expenseHelpers';

export default {
  name: 'Groups',
  components: {
    PageHeader,
    BaseButton,
    AppModal,
    FormField,
    Plus,
    Users,
    Activity,
    MessageSquare,
    RefreshCw
  },
  data() {
    return {
      groups: [],
      isLoading: true,
      isSaving: false,
      globalError: '',
      
      currentUserId: null,

      // Create / Edit modal state
      isModalOpen: false,
      editGroupId: null,
      newGroupName: '',
      newGroupDesc: '',
      modalError: '',
      
      // Join modal state
      isJoinModalOpen: false,
      inviteCodeToJoin: '',
      joinModalError: '',

      // Activity modal state
      isActivityModalOpen: false,
      selectedActivityGroup: null,
      activityLogs: [],
      isLoadingActivity: false,
      activityError: ''
    };
  },
  async mounted() {
      const user = getLocalUser();
      if (user) {
          this.currentUserId = Number(user.id);
      }
      await this.fetchGroups();
  },
  methods: {
    formatCurrencyVal(paise) {
        return formatCurrency(paise / 100);
    },
    async fetchGroups() {
        this.isLoading = true;
        this.globalError = '';
        try {
            this.groups = await getGroups();
        } catch (error) {
            this.globalError = error.message || 'Failed to load groups.';
        } finally {
            this.isLoading = false;
        }
    },
    openGroupModal(group = null) {
      if (group) {
         this.editGroupId = group.id;
         this.newGroupName = group.name;
         this.newGroupDesc = group.description;
      } else {
         this.editGroupId = null;
         this.newGroupName = '';
         this.newGroupDesc = '';
      }
      this.modalError = '';
      this.isModalOpen = true;
    },
    closeGroupModal() {
      this.isModalOpen = false;
    },
    openJoinModal() {
      this.inviteCodeToJoin = '';
      this.joinModalError = '';
      this.isJoinModalOpen = true;
    },
    closeJoinModal() {
      this.isJoinModalOpen = false;
    },
    async handleSaveGroup() {
      this.modalError = '';
      const trimmedName = this.newGroupName.trim();
      const trimmedDesc = this.newGroupDesc.trim();
      
      if (!trimmedName) {
        this.modalError = 'Group name is required.';
        return;
      }
      
      this.isSaving = true;
      try {
          if (this.editGroupId) {
              await updateGroup(this.editGroupId, trimmedName, trimmedDesc);
          } else {
              await createGroup(trimmedName, trimmedDesc);
          }
          await this.fetchGroups();
          this.closeGroupModal();
      } catch (error) {
          this.modalError = error.message || 'Action failed.';
      } finally {
          this.isSaving = false;
      }
    },
    async handleJoinGroup() {
        this.joinModalError = '';
        const code = this.inviteCodeToJoin.trim();
        
        if (!code) {
           this.joinModalError = 'Invite code is required.';
           return;
        }
        
        this.isSaving = true;
        try {
            await joinGroup(code);
            await this.fetchGroups();
            this.closeJoinModal();
        } catch (error) {
            this.joinModalError = error.message || 'Failed to join group.';
        } finally {
            this.isSaving = false;
        }
    },
    async openActivityModal(group) {
      this.selectedActivityGroup = group;
      this.activityLogs = [];
      this.activityError = '';
      this.isActivityModalOpen = true;
      this.isLoadingActivity = true;
      try {
        const logs = await getGroupActivity(group.id);
        this.activityLogs = logs || [];
      } catch (err) {
        this.activityError = err.message || 'Failed to load group activity.';
      } finally {
        this.isLoadingActivity = false;
      }
    },
    closeActivityModal() {
      this.isActivityModalOpen = false;
      this.selectedActivityGroup = null;
      this.activityLogs = [];
    },
    getInitials(name) {
      if (!name) return '?';
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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
