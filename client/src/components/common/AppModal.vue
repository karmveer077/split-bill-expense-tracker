<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
    <!-- Backdrop overlay -->
    <div 
      class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
      @click="close"
    ></div>
    
    <!-- Modal panel -->
    <div 
      class="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-auto flex flex-col max-h-[90vh] overflow-hidden transform transition-all"
    >
      <div class="flex items-center justify-between p-5 border-b border-gray-100">
        <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
        <button 
          @click="close"
          class="text-gray-400 hover:text-gray-500 hover:bg-gray-100 p-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Close modal"
        >
          <X class="w-5 h-5" />
        </button>
      </div>
      
      <div class="p-5 overflow-y-auto flex-1">
        <slot />
      </div>

    </div>
  </div>
</template>

<script>
import { X } from 'lucide-vue-next'

export default {
  name: 'AppModal',
  components: {
    X
  },
  props: {
    isOpen: { type: Boolean, default: false },
    title: { type: String, required: true }
  },
  emits: ['close'],
  methods: {
    close() {
      this.$emit('close')
    }
  }
}
</script>
