<template>
  <div class="space-y-6">
    <PageHeader 
      :title="`Welcome back, ${userName}!`" 
      description="Here's an overview of your group expenses and current net balances" 
    />
    
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <SummaryCard 
        title="You Are Owed" 
        :value="'₹' + formatCurrency(youAreOwedRupees)" 
        valueColorClass="text-emerald-600" 
      />
      <SummaryCard 
        title="You Owe" 
        :value="'₹' + formatCurrency(youOweRupees)" 
        valueColorClass="text-rose-600" 
      />
      <SummaryCard 
        title="Expense Amount You Paid" 
        :value="'₹' + formatCurrency(expenseAmountYouPaid)" 
        valueColorClass="text-indigo-600" 
      />
      <SummaryCard 
        title="Settlements Received" 
        :value="'₹' + formatCurrency(settlementsReceivedRupees)" 
        valueColorClass="text-emerald-600" 
      />
      <SummaryCard 
        title="Settlements Sent" 
        :value="'₹' + formatCurrency(settlementsSentRupees)" 
        valueColorClass="text-amber-600" 
      />
      <SummaryCard 
        title="Total Group Expenses" 
        :value="'₹' + formatCurrency(totalGroupExpenses)" 
        valueColorClass="text-gray-900" 
      />
      <SummaryCard 
        title="Active Groups" 
        :value="groups.length" 
        valueColorClass="text-blue-600" 
      />
      <SummaryCard 
        title="Number of Expenses" 
        :value="expenses.length" 
        valueColorClass="text-purple-600" 
      />
    </div>

    <!-- Main Content Area -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Recent Expenses (Occupies 2 columns) -->
      <div class="lg:col-span-2">
        <SectionCard title="Recent Expenses">
          <div v-if="isLoading" class="py-6 text-center text-gray-500 text-sm">
             Loading expenses...
          </div>
          <div v-else-if="recentExpenses.length === 0" class="py-6 text-center text-gray-500 text-sm">
             No expenses recorded yet.
          </div>
          <ul v-else class="divide-y divide-gray-100">
            <li v-for="expense in recentExpenses" :key="expense.id" class="py-4 flex justify-between items-center sm:items-start group hover:bg-gray-50/50 rounded-lg px-2 -mx-2 transition-colors">
              <div class="flex items-center space-x-4">
                <div class="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                  <Receipt class="w-5 h-5" />
                </div>
                <div class="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                  <p class="text-sm font-medium text-gray-900">{{ expense.title }}</p>
                  <p class="text-xs text-gray-500 mt-1 sm:mt-0">{{ expense.groupName }} • Paid by {{ expense.payerName }}</p>
                </div>
              </div>
              <div class="text-right flex-shrink-0 ml-4">
                <p class="text-sm font-bold text-gray-900">₹{{ formatCurrency(expense.amount) }}</p>
                <p class="text-xs text-gray-500">{{ expense.date }}</p>
              </div>
            </li>
          </ul>
        </SectionCard>
      </div>

      <!-- Group Overview -->
      <div>
        <SectionCard title="Your Groups">
          <div v-if="isLoading" class="py-6 text-center text-gray-500 text-sm">
             Loading groups...
          </div>
          <div v-else-if="groups.length === 0" class="py-6 text-center text-gray-500 text-sm">
             No groups joined yet.
          </div>
          <ul v-else class="space-y-4">
            <li v-for="group in groups" :key="group.id" class="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
              <div class="truncate mr-3">
                <p class="text-sm font-medium text-gray-800 truncate">{{ group.name }}</p>
                <p class="text-xs text-gray-500">{{ group.memberCount }} members</p>
              </div>
              <div class="text-right flex-shrink-0">
                 <p class="text-xs text-gray-500">Expenses</p>
                 <p class="text-sm font-semibold text-gray-900">₹{{ formatCurrencyVal(group.totalExpensePaise) }}</p>
              </div>
            </li>
          </ul>
        </SectionCard>
      </div>
    </div>
  </div>
</template>

<script>
import PageHeader from '../components/common/PageHeader.vue';
import SummaryCard from '../components/common/SummaryCard.vue';
import SectionCard from '../components/common/SectionCard.vue';
import { Receipt } from 'lucide-vue-next';
import { formatCurrency } from '../utils/expenseHelpers.js';
import { getExpenses } from '../services/expenseService';
import { getGroups } from '../services/groupService';
import { getGroupBalances } from '../services/balanceService';
import { getLocalUser } from '../services/authService';

export default {
  name: 'Dashboard',
  components: {
    PageHeader,
    SummaryCard,
    SectionCard,
    Receipt
  },
  data() {
      return {
          groups: [],
          expenses: [],
          isLoading: true,
          currentUserId: null,
          userName: 'User',
          youAreOwedPaise: 0,
          youOwePaise: 0,
          settlementsReceivedPaise: 0,
          settlementsSentPaise: 0
      };
  },
  async mounted() {
      const user = getLocalUser();
      if (user) {
          this.currentUserId = Number(user.id);
          this.userName = user.name;
      }
      this.isLoading = true;
      try {
          const [grpRes, expRes] = await Promise.all([getGroups(), getExpenses()]);
          this.groups = grpRes || [];
          this.expenses = expRes || [];

          if (this.groups.length > 0 && this.currentUserId) {
              const balancePromises = this.groups.map(g => getGroupBalances(g.id).catch(() => null));
              const balanceResults = await Promise.all(balancePromises);

              let positiveOwedPaise = 0;
              let negativeOwePaise = 0;
              let receivedPaise = 0;
              let sentPaise = 0;

              for (const res of balanceResults) {
                  if (res && Array.isArray(res.balances)) {
                      const userBal = res.balances.find(b => b.userId === this.currentUserId);
                      if (userBal) {
                          receivedPaise += Number(userBal.settlementReceivedPaise) || 0;
                          sentPaise += Number(userBal.settlementSentPaise) || 0;
                          if (userBal.netBalancePaise > 0) {
                              positiveOwedPaise += userBal.netBalancePaise;
                          } else if (userBal.netBalancePaise < 0) {
                              negativeOwePaise += Math.abs(userBal.netBalancePaise);
                          }
                      }
                  }
              }

              this.youAreOwedPaise = positiveOwedPaise;
              this.youOwePaise = negativeOwePaise;
              this.settlementsReceivedPaise = receivedPaise;
              this.settlementsSentPaise = sentPaise;
          }
      } catch (err) {
          console.error("Failed to load dashboard data", err);
      } finally {
          this.isLoading = false;
      }
  },
  computed: {
    totalGroupExpenses() {
      return this.expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    },
    expenseAmountYouPaid() {
      return this.expenses
        .filter(e => Number(e.paidByMemberId) === this.currentUserId)
        .reduce((sum, e) => sum + Number(e.amount), 0);
    },
    youAreOwedRupees() {
      return (this.youAreOwedPaise / 100).toFixed(2);
    },
    youOweRupees() {
      return (this.youOwePaise / 100).toFixed(2);
    },
    settlementsReceivedRupees() {
      return (this.settlementsReceivedPaise / 100).toFixed(2);
    },
    settlementsSentRupees() {
      return (this.settlementsSentPaise / 100).toFixed(2);
    },
    recentExpenses() {
      return [...this.expenses]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    }
  },
  methods: {
    formatCurrency,
    formatCurrencyVal(paise) {
        return formatCurrency(paise / 100);
    }
  }
};
</script>
