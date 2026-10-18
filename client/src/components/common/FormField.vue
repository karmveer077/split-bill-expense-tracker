<template>
  <div>
    <label v-if="label" :for="id" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
    </label>
    <div class="relative">
      <input 
        :id="id"
        :type="type"
        :placeholder="placeholder"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        :disabled="disabled"
        class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm transition-colors"
        :class="{ 'bg-gray-50 cursor-not-allowed text-gray-500': disabled }"
      />
    </div>
    <p v-if="error" class="mt-1 text-xs text-rose-500 font-medium">{{ error }}</p>
    <p v-else-if="hint" class="mt-1 flex text-xs text-gray-500">{{ hint }}</p>
  </div>
</template>

<script>
export default {
  name: 'FormField',
  props: {
    id: { type: String, required: true },
    label: { type: String, default: '' },
    type: { type: String, default: 'text' },
    placeholder: { type: String, default: '' },
    modelValue: { type: [String, Number], default: '' },
    hint: { type: String, default: '' },
    error: { type: String, default: '' },
    disabled: { type: Boolean, default: false }
  },
  emits: ['update:modelValue']
}
</script>
