<template>
  <div class="mb-6">
    <h1 class="text-2xl font-bold text-gray-900">{{ title }}</h1>
    <p v-if="description" class="text-gray-500 mt-1 text-sm">{{ description }}</p>
  </div>
</template>

<script>
export default {
  name: 'PageHeader',
  props: {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    }
  }
}
</script>
