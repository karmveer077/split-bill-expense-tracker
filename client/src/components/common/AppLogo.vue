<template>
  <div class="flex items-center space-x-2 text-indigo-600">
    <CircleDollarSign class="w-8 h-8" />
    <span class="text-xl font-bold tracking-tight">SplitBill</span>
  </div>
</template>

<script>
import { CircleDollarSign } from 'lucide-vue-next'

export default {
  name: 'AppLogo',
  components: {
    CircleDollarSign
  }
}
</script>
