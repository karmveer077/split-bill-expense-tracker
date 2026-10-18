<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <PageHeader 
        title="Balances & Settlements" 
        description="View group balances, suggested payments, and payment history." 
      />

      <!-- Group Selector -->
      <div v-if="groups.length > 0" class="flex items-center space-x-2">
        <label for="group-select" class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Group:</label>
        <select
          id="group-select"
          v-model="selectedGroupId"
          @change="onGroupChange"
          class="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 font-medium shadow-sm hover:border-gray-400 transition-colors"
        >
          <option v-for="grp in groups" :key="grp.id" :value="grp.id">
            {{ grp.name }}
          </option>
        </select>
      </div>
    </div>

    <!-- Empty State: No Groups -->
    <div v-if="!isLoadingGroups && groups.length === 0" class="p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div class="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <Users class="w-8 h-8" />
      </div>
      <h3 class="text-lg font-bold text-gray-900 mb-1">No Groups Found</h3>
      <p class="text-sm text-gray-500 max-w-md mx-auto mb-6">
        You are not a member of any groups yet. Create or join a group first to view balances and settle debts.
      </p>
      <router-link
        to="/groups"
        class="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
      >
        Go to Groups
      </router-link>
    </div>

    <!-- Main Content when Groups exist -->
    <div v-else class="space-y-6">
      <!-- Loading indicator -->
      <div v-if="isLoadingData" class="py-12 text-center text-gray-500 text-sm">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent mb-2"></div>
        <p>Loading balances and settlements...</p>
      </div>

      <!-- Content grid when data loaded -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- Group Balances Card -->
        <SectionCard :title="currentGroupName + ' Balances'">
          <template #header-action>
            <span class="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-semibold">
              {{ balances.length }} {{ balances.length === 1 ? 'Member' : 'Members' }}
            </span>
          </template>

          <div v-if="balances.length === 0" class="py-8 text-center text-gray-400 text-sm">
            No member data found for this group.
          </div>

          <div v-else class="space-y-4">
            <div 
              v-for="member in balances" 
              :key="member.userId" 
              class="p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center text-sm font-bold">
                    {{ member.name ? member.name.charAt(0).toUpperCase() : 'U' }}
                  </div>
                  <div>
                    <span class="text-sm font-semibold text-gray-900">
                      {{ member.name }}
                      <span v-if="member.userId === currentUserId" class="text-xs text-indigo-600 font-bold ml-1">(You)</span>
                    </span>
                    <p class="text-xs text-gray-400">{{ member.email }}</p>
                  </div>
                </div>
                
                <!-- Status & Net Amount -->
                <div class="flex items-center space-x-2">
                  <span 
                    :class="[
                      'font-bold text-sm',
                      member.netBalancePaise > 0 ? 'text-emerald-600' : (member.netBalancePaise < 0 ? 'text-rose-600' : 'text-gray-500')
                    ]"
                  >
                    {{ member.netBalancePaise > 0 ? '+' : '' }}₹{{ (member.netBalancePaise / 100).toFixed(2) }}
                  </span>

                  <!-- Status Icon & Label -->
                  <div 
                    v-if="member.netBalancePaise > 0"
                    class="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1"
                  >
                    <ArrowUpRight class="w-3.5 h-3.5" />
                    <span>Should receive</span>
                  </div>
                  <div 
                    v-else-if="member.netBalancePaise < 0"
                    class="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center space-x-1"
                  >
                    <ArrowDownRight class="w-3.5 h-3.5" />
                    <span>Owes</span>
                  </div>
                  <div 
                    v-else
                    class="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-500 border border-gray-200 flex items-center space-x-1"
                  >
                    <CheckCircle2 class="w-3.5 h-3.5" />
                    <span>Settled</span>
                  </div>
                </div>
              </div>

              <!-- Financial Breakdown breakdown pills -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-gray-50 text-xs">
                <div class="bg-gray-50/70 p-2 rounded-lg">
                  <p class="text-gray-400">Paid Expenses</p>
                  <p class="font-semibold text-gray-700">₹{{ (member.expensePaidPaise / 100).toFixed(2) }}</p>
                </div>
                <div class="bg-gray-50/70 p-2 rounded-lg">
                  <p class="text-gray-400">Share Owed</p>
                  <p class="font-semibold text-gray-700">₹{{ (member.expenseSharePaise / 100).toFixed(2) }}</p>
                </div>
                <div class="bg-gray-50/70 p-2 rounded-lg">
                  <p class="text-gray-400">Sent</p>
                  <p class="font-semibold text-gray-700">₹{{ (member.settlementSentPaise / 100).toFixed(2) }}</p>
                </div>
                <div class="bg-gray-50/70 p-2 rounded-lg">
                  <p class="text-gray-400">Received</p>
                  <p class="font-semibold text-gray-700">₹{{ (member.settlementReceivedPaise / 100).toFixed(2) }}</p>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <!-- Suggested Settlements Card -->
        <SectionCard title="Suggested Settlements">
          <!-- All settled state -->
          <div v-if="suggestions.length === 0" class="py-8 text-center bg-emerald-50/60 rounded-xl border border-emerald-100 p-6">
            <CheckCircle2 class="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <h4 class="text-sm font-bold text-emerald-900">Everyone in this group is settled.</h4>
            <p class="text-xs text-emerald-700 mt-1">No outstanding balances or payments required!</p>
          </div>

          <!-- Suggestions List -->
          <ul v-else class="space-y-3">
            <li 
              v-for="(suggestion, idx) in suggestions" 
              :key="idx"
              class="p-4 border border-gray-100 rounded-xl bg-gray-50/80 hover:bg-white hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div class="flex items-center space-x-2 text-sm text-gray-800">
                <span class="font-semibold text-gray-900">
                  {{ suggestion.payerName }}
                  <span v-if="suggestion.payerId === currentUserId" class="text-xs text-indigo-600 font-bold">(You)</span>
                </span>
                <span class="text-gray-400 text-xs">pays</span>
                <span class="font-semibold text-gray-900">
                  {{ suggestion.receiverName }}
                  <span v-if="suggestion.receiverId === currentUserId" class="text-xs text-indigo-600 font-bold">(You)</span>
                </span>
              </div>

              <div class="flex items-center justify-between sm:justify-end space-x-3">
                <span class="font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-md text-sm">
                  ₹{{ (suggestion.amountPaise / 100).toFixed(2) }}
                </span>
                
                <button
                  type="button"
                  @click="openRecordModal(suggestion)"
                  class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center space-x-1"
                >
                  <CreditCard class="w-3.5 h-3.5" />
                  <span>Record Payment</span>
                </button>
              </div>
            </li>
          </ul>
        </SectionCard>

      </div>

      <!-- Settlement History Section -->
      <SectionCard title="Settlement History">
        <template #header-action>
          <span class="text-xs text-gray-500 font-medium">
            {{ settlements.length }} {{ settlements.length === 1 ? 'Record' : 'Records' }}
          </span>
        </template>

        <div v-if="settlements.length === 0" class="py-8 text-center text-gray-400 text-sm">
          No settlements recorded yet for this group.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm text-gray-600">
            <thead class="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-100">
              <tr>
                <th class="py-3 px-4">Payer</th>
                <th class="py-3 px-4">Receiver</th>
                <th class="py-3 px-4 text-right">Amount</th>
                <th class="py-3 px-4">Date</th>
                <th class="py-3 px-4">Recorded By</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="settle in settlements" :key="settle.id" class="hover:bg-gray-50/50 transition-colors">
                <td class="py-3 px-4 font-medium text-gray-900">
                  {{ settle.payerName }}
                  <span v-if="settle.payerId === currentUserId" class="text-xs text-indigo-600 font-bold ml-1">(You)</span>
                </td>
                <td class="py-3 px-4 font-medium text-gray-900">
                  {{ settle.receiverName }}
                  <span v-if="settle.receiverId === currentUserId" class="text-xs text-indigo-600 font-bold ml-1">(You)</span>
                </td>
                <td class="py-3 px-4 text-right font-bold text-emerald-600">
                  ₹{{ (settle.amountPaise / 100).toFixed(2) }}
                </td>
                <td class="py-3 px-4 text-gray-500 text-xs">
                  {{ settle.settlementDate }}
                </td>
                <td class="py-3 px-4 text-gray-500 text-xs">
                  {{ settle.createdByName || 'Member' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>

    <!-- Record Settlement Modal -->
    <div 
      v-if="isModalOpen" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div class="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-md w-full p-6 space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-gray-100">
          <h3 class="text-base font-bold text-gray-900 flex items-center space-x-2">
            <CreditCard class="w-5 h-5 text-indigo-600" />
            <span>Record Settlement Payment</span>
          </h3>
          <button 
            type="button" 
            @click="closeRecordModal" 
            class="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Alert messages -->
        <div v-if="modalError" class="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
          {{ modalError }}
        </div>
        <div v-if="modalSuccess" class="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg">
          {{ modalSuccess }}
        </div>

        <form @submit.prevent="submitSettlement" class="space-y-4">
          <!-- Payer (Readonly) -->
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Payer (Who Paid)</label>
            <input 
              type="text" 
              :value="activeSuggestion.payerName" 
              disabled 
              class="w-full bg-gray-100 border border-gray-200 text-gray-700 text-sm rounded-lg p-2.5 font-medium cursor-not-allowed"
            />
          </div>

          <!-- Receiver (Readonly) -->
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Receiver (Who Received)</label>
            <input 
              type="text" 
              :value="activeSuggestion.receiverName" 
              disabled 
              class="w-full bg-gray-100 border border-gray-200 text-gray-700 text-sm rounded-lg p-2.5 font-medium cursor-not-allowed"
            />
          </div>

          <!-- Amount (Readonly) -->
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Settlement Amount</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 font-bold text-sm">₹</span>
              <input 
                type="text" 
                :value="(activeSuggestion.amountPaise / 100).toFixed(2)" 
                disabled 
                class="w-full bg-gray-100 border border-gray-200 text-gray-800 text-sm rounded-lg pl-7 pr-3 py-2.5 font-bold cursor-not-allowed"
              />
            </div>
          </div>

          <!-- Settlement Date (Editable, Defaulting to today) -->
          <div>
            <label for="settlement-date" class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Payment Date
            </label>
            <input 
              id="settlement-date"
              type="date" 
              v-model="modalDate" 
              :max="todayDateString"
              required 
              class="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
            />
            <p class="text-xs text-gray-400 mt-1">Date cannot be in the future.</p>
          </div>

          <div class="pt-3 border-t border-gray-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              @click="closeRecordModal"
              :disabled="isSubmitting"
              class="px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center space-x-2"
            >
              <span v-if="isSubmitting">Recording...</span>
              <span v-else>Confirm Settlement</span>
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script>
import PageHeader from '../components/common/PageHeader.vue';
import SectionCard from '../components/common/SectionCard.vue';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  Users, 
  CreditCard, 
  X 
} from 'lucide-vue-next';
import { getGroups } from '../services/groupService';
import { getGroupBalances, getSettlementSuggestions } from '../services/balanceService';
import { getSettlementHistory, createSettlement } from '../services/settlementService';
import { getLocalUser } from '../services/authService';

export default {
  name: 'Balances',
  components: {
    PageHeader,
    SectionCard,
    ArrowUpRight,
    ArrowDownRight,
    CheckCircle2,
    Users,
    CreditCard,
    X
  },
  data() {
    return {
      groups: [],
      selectedGroupId: null,
      balances: [],
      suggestions: [],
      settlements: [],
      isLoadingGroups: true,
      isLoadingData: false,
      currentUserId: null,

      // Modal state
      isModalOpen: false,
      isSubmitting: false,
      modalError: null,
      modalSuccess: null,
      activeSuggestion: {},
      modalDate: ''
    };
  },
  computed: {
    currentGroupName() {
      const g = this.groups.find(grp => grp.id === Number(this.selectedGroupId));
      return g ? g.name : 'Group';
    },
    todayDateString() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  },
  async mounted() {
    const user = getLocalUser();
    if (user) {
      this.currentUserId = Number(user.id);
    }
    await this.loadInitialGroups();
  },
  methods: {
    async loadInitialGroups() {
      this.isLoadingGroups = true;
      try {
        const grpList = await getGroups();
        this.groups = grpList || [];
        if (this.groups.length > 0) {
          this.selectedGroupId = this.groups[0].id;
          await this.loadGroupFinancials(this.selectedGroupId);
        }
      } catch (err) {
        console.error('Failed to load groups for balances:', err);
      } finally {
        this.isLoadingGroups = false;
      }
    },

    async onGroupChange() {
      if (this.selectedGroupId) {
        await this.loadGroupFinancials(this.selectedGroupId);
      }
    },

    async loadGroupFinancials(groupId) {
      this.isLoadingData = true;
      try {
        const [balRes, suggRes, histRes] = await Promise.all([
          getGroupBalances(groupId),
          getSettlementSuggestions(groupId),
          getSettlementHistory(groupId)
        ]);
        this.balances = balRes.balances || [];
        this.suggestions = suggRes.suggestions || [];
        this.settlements = histRes || [];
      } catch (err) {
        console.error('Failed to load group financial details:', err);
      } finally {
        this.isLoadingData = false;
      }
    },

    openRecordModal(suggestion) {
      this.activeSuggestion = { ...suggestion };
      this.modalDate = this.todayDateString;
      this.modalError = null;
      this.modalSuccess = null;
      this.isModalOpen = true;
    },

    closeRecordModal() {
      this.isModalOpen = false;
      this.activeSuggestion = {};
      this.modalError = null;
      this.modalSuccess = null;
      this.isSubmitting = false;
    },

    async submitSettlement() {
      this.modalError = null;
      this.modalSuccess = null;
      this.isSubmitting = true;

      try {
        await createSettlement(this.selectedGroupId, {
          payerId: this.activeSuggestion.payerId,
          receiverId: this.activeSuggestion.receiverId,
          amountPaise: this.activeSuggestion.amountPaise,
          settlementDate: this.modalDate
        });

        this.modalSuccess = 'Settlement recorded successfully!';
        setTimeout(async () => {
          this.closeRecordModal();
          // Refetch fresh balances, suggestions, and history
          await this.loadGroupFinancials(this.selectedGroupId);
        }, 600);
      } catch (err) {
        this.modalError = err.message || 'Failed to record settlement.';
      } finally {
        this.isSubmitting = false;
      }
    }
  }
};
</script>
