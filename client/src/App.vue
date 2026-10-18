<template>
  <div class="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
    <AppSidebar 
      :isMobileMenuOpen="isMobileMenuOpen" 
      @closeMobileMenu="closeMobileMenu" 
      v-if="!isPublicRoute"
    />
    
    <div class="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
      <AppTopbar 
        @toggleMobileMenu="toggleMobileMenu" 
        v-if="!isPublicRoute"
      />
      
      <main class="flex-1 overflow-y-auto w-full relative h-full">
        <div :class="!isPublicRoute ? 'p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto h-full' : 'h-full'">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import AppSidebar from './components/layout/AppSidebar.vue'
import AppTopbar from './components/layout/AppTopbar.vue'

export default {
  name: 'App',
  components: {
    AppSidebar,
    AppTopbar
  },
  data() {
    return {
      isMobileMenuOpen: false
    }
  },
  computed: {
    isPublicRoute() {
      return this.$route.meta.public === true
    }
  },
  methods: {
    toggleMobileMenu() {
      this.isMobileMenuOpen = !this.isMobileMenuOpen
    },
    closeMobileMenu() {
      this.isMobileMenuOpen = false
    }
  }
}
</script>
