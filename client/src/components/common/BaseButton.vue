<template>
  <button 
    :type="type" 
    :disabled="disabled"
    class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
    :class="[
      variant === 'primary' ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm focus:ring-indigo-500' : 
      variant === 'secondary' ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-sm focus:ring-indigo-500' :
      variant === 'danger' ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm focus:ring-rose-500' :
      variant === 'ghost' ? 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-500' : '',
      disabled ? 'opacity-50 cursor-not-allowed' : '',
      fullWidth ? 'w-full' : ''
    ]"
  >
    <slot name="icon-left" />
    <slot />
    <slot name="icon-right" />
  </button>
</template>

<script>
export default {
  name: 'BaseButton',
  props: {
    type: { type: String, default: 'button' },
    variant: { type: String, default: 'primary' },
    disabled: { type: Boolean, default: false },
    fullWidth: { type: Boolean, default: false }
  }
}
</script>
