<template>
  <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
    <div class="text-sm font-medium text-gray-500">{{ title }}</div>
    <div :class="['text-2xl font-bold mt-2', valueColorClass]">{{ value }}</div>
  </div>
</template>

<script>
export default {
  name: 'SummaryCard',
  props: {
    title: {
      type: String,
      required: true
    },
    value: {
      type: [String, Number],
      required: true
    },
    valueColorClass: {
      type: String,
      default: 'text-gray-900'
    }
  }
}
</script>
