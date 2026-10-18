<template>
  <div class="flex flex-col items-center justify-center p-12 w-full h-full min-h-[50vh]">
    <div class="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
    <h3 class="text-lg font-medium text-gray-900 mb-1">{{ title }}</h3>
    <p class="text-sm text-gray-500 text-center max-w-sm">{{ message }}</p>
  </div>
</template>

<script>
export default {
  name: 'LoadingState',
  props: {
    title: { type: String, default: 'Loading...' },
    message: { type: String, default: 'Please wait while we fetch the latest data.' }
  }
}
</script>
