<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <div v-if="title" class="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
      <h2 class="text-lg font-semibold text-gray-800">{{ title }}</h2>
      <slot name="header-action"></slot>
    </div>
    <div class="p-6">
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SectionCard',
  props: {
    title: {
      type: String,
      default: ''
    }
  }
}
</script>
