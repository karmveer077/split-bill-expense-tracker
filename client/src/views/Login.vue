<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8">
      <div class="text-center mb-8">
        <AppLogo class="mx-auto" />
        <h2 class="mt-6 text-2xl font-bold text-gray-900">Welcome back</h2>
        <p class="mt-2 text-sm text-gray-500">Please sign in to your account</p>
      </div>

      <form class="space-y-5" @submit.prevent="handleLogin">
        <FormField 
          id="email-address" 
          label="Email address" 
          type="email" 
          v-model="form.email" 
          :error="errors.email"
          placeholder="you@example.com"
        />
        
        <FormField 
          id="password" 
          label="Password" 
          type="password" 
          v-model="form.password" 
          :error="errors.password"
          placeholder="••••••••"
        />

        <!-- No account found (404) — show sign-up nudge -->
        <div v-if="noAccountError" class="p-3 bg-amber-50 border border-amber-200 text-sm text-amber-800 rounded-md">
          {{ noAccountError }}
          <router-link to="/signup" class="ml-1 font-semibold text-indigo-600 hover:text-indigo-500 underline">
            Sign up now →
          </router-link>
        </div>

        <!-- Wrong password (401) or network error -->
        <div v-else-if="apiError" class="p-3 bg-red-50 border border-red-200 text-sm text-red-600 rounded-md">
          {{ apiError }}
        </div>

        <div>
          <BaseButton type="submit" class="w-full justify-center" :disabled="isLoading">
            {{ isLoading ? 'Signing in...' : 'Sign in' }}
          </BaseButton>
        </div>
      </form>

      <p class="mt-6 text-center text-sm text-gray-600">
        Don't have an account?
        <router-link to="/signup" class="font-medium text-indigo-600 hover:text-indigo-500">Sign up</router-link>
      </p>
    </div>
  </div>
</template>

<script>
import AppLogo from '../components/common/AppLogo.vue'
import FormField from '../components/common/FormField.vue'
import BaseButton from '../components/common/BaseButton.vue'
import { validateLoginForm } from '../utils/expenseHelpers.js'
import { login } from '../services/authService'

export default {
  name: 'Login',
  components: {
    AppLogo,
    FormField,
    BaseButton
  },
  data() {
    return {
      form: { email: '', password: '' },
      errors: {},
      apiError: '',
      noAccountError: '',
      isLoading: false
    }
  },
  methods: {
    async handleLogin() {
      this.apiError = ''
      this.noAccountError = ''
      const validation = validateLoginForm(this.form.email, this.form.password)
      this.errors = validation.errors

      if (!validation.isValid) return

      this.isLoading = true
      try {
        await login(this.form.email, this.form.password)
        this.$router.push('/dashboard')
      } catch (err) {
        // 404 → no account with this email
        if (err.status === 404) {
          this.noAccountError = err.message
        } else {
          // 401 wrong password, 0 = network, or anything else
          this.apiError = err.message || 'Failed to sign in. Please try again.'
        }
      } finally {
        this.isLoading = false
      }
    }
  }
}
</script>
