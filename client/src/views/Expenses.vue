<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 mb-6">
      <PageHeader 
        title="All Expenses" 
        description="View and filter all shared expenses" 
        class="mb-0"
      />
      <BaseButton @click="openExpenseModal(false)" class="flex items-center w-full sm:w-auto">
        <Plus class="w-4 h-4 mr-2" />
        Add Expense
      </BaseButton>
    </div>
    
    <div v-if="globalError" class="p-4 bg-red-50 text-red-700 rounded-md mb-6 border border-red-100">
       {{ globalError }}
    </div>

    <!-- Main Content Area with Filters -->
    <SectionCard>
      <!-- Filters -->
      <div class="flex flex-col md:flex-row gap-4 mb-6">
        <div class="flex-1 relative">
          <Search class="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            v-model="filters.search"
            placeholder="Search titles or descriptions..." 
            class="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors" 
          />
        </div>
        
        <select v-model="filters.groupId" class="bg-white border border-gray-300 rounded-lg text-sm px-4 py-2 text-gray-700 w-full md:w-auto">
          <option value="">All Groups</option>
          <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
        </select>
        
        <select v-model="filters.category" class="bg-white border border-gray-300 rounded-lg text-sm px-4 py-2 text-gray-700 w-full md:w-auto">
          <option value="">All Categories</option>
          <option v-for="cat in categories" :key="cat">{{ cat }}</option>
        </select>
        
        <BaseButton @click="clearFilters" variant="ghost" class="w-full md:w-auto whitespace-nowrap">
          Clear Filters
        </BaseButton>
      </div>
      
      <!-- Expense List/Table -->
      <div v-if="isLoading" class="py-12 text-center text-gray-500 text-sm">
          Loading expenses...
      </div>
      <div v-else-if="filteredExpenses.length === 0" class="py-12 text-center text-gray-500 flex flex-col items-center">
        <Receipt class="w-12 h-12 text-gray-300 mb-3" />
        <p>No expenses match your filters.</p>
      </div>
      
      <div v-else>
        <!-- Desktop Table -->
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50 border-y border-gray-200 text-sm text-gray-500">
                <th class="py-3 px-4 font-medium">Date</th>
                <th class="py-3 px-4 font-medium">Description</th>
                <th class="py-3 px-4 font-medium">Group</th>
                <th class="py-3 px-4 font-medium">Paid By</th>
                <th class="py-3 px-4 font-medium text-right">Amount</th>
                <th class="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="expense in filteredExpenses" :key="expense.id" class="hover:bg-gray-50 transition-colors">
                <td class="py-3 px-4 text-sm text-gray-500">{{ expense.date }}</td>
                <td class="py-3 px-4 text-sm font-medium text-gray-900">
                   {{ expense.title }}
                   <span v-if="expense.category" class="block text-xs text-gray-400 font-normal mt-0.5">{{ expense.category }}</span>
                </td>
                <td class="py-3 px-4 text-sm text-gray-600">
                  <span class="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs">{{ expense.groupName }}</span>
                </td>
                <td class="py-3 px-4 text-sm text-gray-600">{{ expense.payerName }}</td>
                <td class="py-3 px-4 text-sm font-bold text-gray-900 text-right">₹{{ formatCurrency(expense.amount) }}</td>
                <td class="py-3 px-4 text-sm text-right space-x-2">
                   <button v-if="expense.createdById === currentUserId" @click="openExpenseModal(true, expense)" class="text-indigo-600 hover:text-indigo-800 font-medium">Edit</button>
                   <button v-if="expense.createdById === currentUserId" @click="confirmDelete(expense)" class="text-rose-600 hover:text-rose-800 font-medium">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile List -->
        <div class="md:hidden space-y-4">
          <div v-for="expense in filteredExpenses" :key="'mobile-'+expense.id" class="bg-white border border-gray-100 rounded-lg p-4 flex flex-col space-y-3 shadow-sm">
            <div class="flex justify-between items-start">
              <div>
                <h4 class="font-medium text-gray-900">{{ expense.title }}</h4>
                <div class="flex items-center space-x-2 mt-1">
                   <span class="inline-block bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px]">{{ expense.groupName }}</span>
                   <span class="text-xs text-gray-400">{{ expense.category }}</span>
                </div>
              </div>
              <span class="font-bold text-gray-900 text-right">₹{{ formatCurrency(expense.amount) }}</span>
            </div>
            <div class="flex justify-between items-center text-xs text-gray-500 pt-2 border-t border-gray-50">
              <span>{{ expense.date }}</span>
              <span>Paid by {{ expense.payerName }}</span>
            </div>
            <div v-if="expense.createdById === currentUserId" class="flex justify-end space-x-4 pt-2 border-t border-gray-50 text-xs font-medium">
               <button @click="openExpenseModal(true, expense)" class="text-indigo-600">Edit</button>
               <button @click="confirmDelete(expense)" class="text-rose-600">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </SectionCard>

    <!-- Modal for Create/Edit Expense -->
    <AppModal 
      :isOpen="isModalOpen" 
      :title="isEditMode ? 'Edit Expense' : 'Add an Expense'" 
      @close="closeExpenseModal"
    >
      <form class="space-y-4" @submit.prevent="saveExpense">
        <!-- Group Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Group *</label>
          <select 
            v-model="form.groupId" 
            @change="handleGroupChange"
            :disabled="isEditMode"
            class="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
          >
            <option value="" disabled>Select a group</option>
            <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
          </select>
        </div>
        
        <FormField 
          id="expense-title" 
          label="Description *" 
          v-model="form.title"
          placeholder="e.g. Dinner at Pizza Corner" 
        />
        
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField 
            id="expense-amount" 
            label="Amount (₹) *" 
            type="number"
            v-model="form.amount"
            placeholder="0.00" 
          />
          <FormField 
            id="expense-date" 
            label="Date *" 
            type="date"
            v-model="form.date"
          />
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
           <div>
             <label class="block text-sm font-medium text-gray-700 mb-1">Category *</label>
             <select v-model="form.category" class="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm">
               <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
             </select>
           </div>
           <div>
             <label class="block text-sm font-medium text-gray-700 mb-1">Paid By *</label>
             <select v-model="form.paidByMemberId" :disabled="!form.groupId" class="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-400">
               <option value="" disabled>Select payer</option>
               <option v-for="m in currentGroupMembers" :key="m.id" :value="m.id">{{ m.name }}</option>
             </select>
           </div>
        </div>

        <!-- Participants & Splits -->
        <div v-if="form.groupId">
          <label class="block text-sm font-medium text-gray-700 mb-2">Split Math</label>
          <div class="flex space-x-4 mb-4">
             <label class="flex items-center space-x-2 text-sm text-gray-700">
                <input type="radio" v-model="form.splitType" value="equal" class="text-indigo-600 focus:ring-indigo-500">
                <span>Equal Split</span>
             </label>
             <label class="flex items-center space-x-2 text-sm text-gray-700">
                <input type="radio" v-model="form.splitType" value="custom" class="text-indigo-600 focus:ring-indigo-500">
                <span>Custom Split</span>
             </label>
          </div>
          
          <div class="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
             <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Participants</h4>
             <div v-for="m in currentGroupMembers" :key="m.id" class="flex items-center justify-between">
                <label class="flex items-center space-x-2 text-sm text-gray-800">
                   <input type="checkbox" :value="m.id" v-model="form.participantIds" class="rounded text-indigo-600 focus:ring-indigo-500">
                   <span>{{ m.name }}</span>
                </label>
                
                <!-- Custom Split Input -->
                <div v-if="form.splitType === 'custom' && form.participantIds.includes(m.id)" class="w-24">
                   <input 
                     type="number" 
                     step="0.01"
                     v-model="form.customSplits[m.id]" 
                     placeholder="0.00"
                     class="block w-full rounded border-gray-300 px-2 py-1 text-right text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                   />
                </div>
             </div>
             
             <!-- Custom Split Math Checking -->
             <div v-if="form.splitType === 'custom' && form.amount > 0" class="mt-4 pt-4 border-t border-gray-200 text-sm flex justify-between font-medium">
                <span :class="customRemainderAmount !== 0 ? 'text-rose-600' : 'text-emerald-600'">
                  Total Allocated: ₹{{ customAllocatedTotal.toFixed(2) }}
                  <span v-if="customRemainderAmount !== 0" class="ml-2">(Diff: ₹{{ customRemainderAmount.toFixed(2) }})</span>
                </span>
                <span class="text-gray-900">Expense: ₹{{ Number(form.amount || 0).toFixed(2) }}</span>
             </div>
          </div>
        </div>

        <div v-if="modalError" class="p-2 bg-red-50 text-red-700 text-sm rounded border border-red-100 mt-2">
          {{ modalError }}
        </div>
        
        <div class="pt-4 border-t border-gray-100 flex justify-end space-x-3 mt-6">
          <BaseButton @click="closeExpenseModal" variant="ghost" type="button" :disabled="isSaving">Cancel</BaseButton>
          <BaseButton type="submit" :disabled="isSaving">{{ isSaving ? 'Saving...' : (isEditMode ? 'Update' : 'Save') }}</BaseButton>
        </div>
      </form>
    </AppModal>

    <!-- Delete Confirmation Modal -->
    <AppModal 
      :isOpen="isDeleteModalOpen" 
      title="Delete Expense" 
      @close="closeDeleteModal"
    >
      <div class="space-y-4">
        <p class="text-sm text-gray-700">Are you sure you want to delete <span class="font-bold">"{{ expenseToDelete?.title }}"</span>? This removes it for everyone in the group.</p>
        <div class="pt-4 border-t border-gray-100 flex justify-end space-x-3">
          <BaseButton @click="closeDeleteModal" variant="ghost" :disabled="isSaving">Cancel</BaseButton>
          <BaseButton @click="proceedDelete" class="bg-rose-600 hover:bg-rose-700" :disabled="isSaving">{{ isSaving ? 'Deleting...' : 'Yes, Delete' }}</BaseButton>
        </div>
      </div>
    </AppModal>

  </div>
</template>

<script>
import PageHeader from '../components/common/PageHeader.vue'
import SectionCard from '../components/common/SectionCard.vue'
import BaseButton from '../components/common/BaseButton.vue'
import AppModal from '../components/common/AppModal.vue'
import FormField from '../components/common/FormField.vue'
import { Plus, Search, Receipt } from 'lucide-vue-next'
import { formatCurrency, filterExpenses } from '../utils/expenseHelpers.js'
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../services/expenseService'
import { getGroups } from '../services/groupService'
import { getLocalUser } from '../services/authService'

export default {
  name: 'Expenses',
  components: {
    PageHeader, SectionCard, BaseButton, AppModal, FormField, Plus, Search, Receipt
  },
  data() {
    return {
      expenses: [],
      groups: [],
      isLoading: true,
      currentUserId: null,
      globalError: '',
      modalError: '',
      isSaving: false,
      
      filters: { search: '', groupId: '', category: '', payerId: '' },
      categories: ['Food', 'Travel', 'Shopping', 'Household', 'Entertainment', 'Other'],
      
      isModalOpen: false,
      isEditMode: false,
      isDeleteModalOpen: false,
      expenseToDelete: null,
      
      form: this.getInitialFormState()
    }
  },
  async mounted() {
      const user = getLocalUser();
      if (user) {
          this.currentUserId = Number(user.id);
      }
      await this.loadData();
  },
  computed: {
    filteredExpenses() {
      return filterExpenses(this.expenses, this.filters)
    },
    currentGroupMembers() {
      const g = this.groups.find(g => g.id === this.form.groupId)
      return g ? g.members : []
    },
    customAllocatedTotal() {
      let total = 0;
      for (const id of this.form.participantIds) {
         total += Number(this.form.customSplits[id]) || 0;
      }
      return total;
    },
    customRemainderAmount() {
      return Number(this.form.amount || 0) - this.customAllocatedTotal;
    }
  },
  methods: {
    formatCurrency,
    async loadData() {
        this.isLoading = true;
        this.globalError = '';
        try {
            const [grpRes, expRes] = await Promise.all([getGroups(), getExpenses()]);
            this.groups = grpRes;
            this.expenses = expRes;
        } catch (error) {
            this.globalError = error.message || 'Failed to load expenses data.';
        } finally {
            this.isLoading = false;
        }
    },
    clearFilters() {
      this.filters = { search: '', groupId: '', category: '', payerId: '' }
    },
    getInitialFormState() {
      return {
        id: null,
        title: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        groupId: '',
        category: '',
        paidByMemberId: '',
        participantIds: [],
        splitType: 'equal',
        customSplits: {}
      }
    },
    openExpenseModal(editMode, expense = null) {
      this.modalError = ''
      this.isEditMode = editMode
      
      if (editMode && expense) {
        const customSplits = {}
        if (expense.splitType === 'custom' && expense.splits) {
           expense.splits.forEach(s => { customSplits[s.memberId] = s.amount })
        }
        
        this.form = {
          id: expense.id,
          title: expense.title,
          amount: expense.amount,
          date: expense.date,
          groupId: expense.groupId,
          category: expense.category,
          paidByMemberId: expense.paidByMemberId,
          participantIds: [...expense.participantIds],
          splitType: expense.splitType || 'equal',
          customSplits
        }
      } else {
        this.form = this.getInitialFormState()
      }
      this.isModalOpen = true
    },
    closeExpenseModal() {
      this.isModalOpen = false
    },
    handleGroupChange() {
      this.form.paidByMemberId = ''
      this.form.participantIds = []
      this.form.customSplits = {}
    },
    async saveExpense() {
      this.modalError = ''
      
      if (!this.form.groupId || !this.form.title || !this.form.amount || !this.form.date || !this.form.category || !this.form.paidByMemberId) {
          this.modalError = 'All main fields are mandatory.';
          return;
      }
      if (this.form.participantIds.length === 0) {
          this.modalError = 'At least one participant is required.';
          return;
      }
      
      let explicitSplits = []
      if (this.form.splitType === 'custom') {
         explicitSplits = this.form.participantIds.map(id => ({
             memberId: id,
             amount: Number(this.form.customSplits[id] || 0)
         }))
      }
      
      const payload = {
         title: this.form.title,
         amount: Number(this.form.amount),
         category: this.form.category,
         date: this.form.date,
         paidByUserId: this.form.paidByMemberId,
         participantIds: [...this.form.participantIds],
         splitType: this.form.splitType,
         splits: explicitSplits // the backend parses this and calculates equal sharing manually if splitType is equal
      }
      
      this.isSaving = true;
      try {
          if (this.isEditMode) {
              await updateExpense(this.form.id, payload)
          } else {
              await createExpense(this.form.groupId, payload)
          }
          await this.loadData();
          this.closeExpenseModal();
      } catch (error) {
          this.modalError = error.message || 'Failed to save expense.'
      } finally {
          this.isSaving = false;
      }
    },
    confirmDelete(expense) {
      this.expenseToDelete = expense
      this.isDeleteModalOpen = true
    },
    closeDeleteModal() {
      this.isDeleteModalOpen = false
      this.expenseToDelete = null
    },
    async proceedDelete() {
      if (!this.expenseToDelete) return;
      this.isSaving = true;
      try {
          await deleteExpense(this.expenseToDelete.id);
          await this.loadData();
          this.closeDeleteModal();
      } catch (error) {
          this.globalError = error.message || 'Failed to delete expense.';
          this.closeDeleteModal();
      } finally {
          this.isSaving = false;
      }
    }
  }
}
</script>
