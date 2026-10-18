<template>
  <div class="flex flex-col items-center justify-center p-12 text-center w-full h-full min-h-[50vh]">
    <div class="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4">
      <AlertTriangle class="w-8 h-8" />
    </div>
    <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ title }}</h3>
    <p class="text-sm text-gray-500 max-w-sm mb-6">{{ message }}</p>
    <BaseButton v-if="actionText" @click="$emit('action')" variant="secondary">
      {{ actionText }}
    </BaseButton>
  </div>
</template>

<script>
import { AlertTriangle } from 'lucide-vue-next'
import BaseButton from './BaseButton.vue'

export default {
  name: 'ErrorState',
  components: {
    AlertTriangle,
    BaseButton
  },
  props: {
    title: { type: String, default: 'Something went wrong' },
    message: { type: String, default: 'We encountered an error processing your request. Please try again.' },
    actionText: { type: String, default: 'Try Again' }
  },
  emits: ['action']
}
</script>
