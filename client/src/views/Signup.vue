<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <AppLogo class="mx-auto" />
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        Create a new account
      </h2>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <form class="space-y-6" @submit.prevent="handleSignup">
          <FormField 
            id="name" 
            label="Full Name" 
            v-model="form.name" 
            :error="errors.name"
            placeholder="Jane Doe"
          />
          
          <FormField 
            id="email" 
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
            placeholder="e.g. Campus@2026"
          />
          <p class="-mt-4 text-xs text-gray-400">Min 8 chars · uppercase · lowercase · number · special char</p>
          
          <FormField 
            id="confirm-password" 
            label="Confirm Password" 
            type="password" 
            v-model="form.confirmPassword" 
            :error="errors.confirmPassword"
          />
          
          <div v-if="apiError" class="p-3 bg-red-50 text-sm text-red-600 rounded-md">
            {{ apiError }}
          </div>

          <div>
            <BaseButton type="submit" class="w-full justify-center" :disabled="isLoading">
              {{ isLoading ? 'Creating Account...' : 'Sign up' }}
            </BaseButton>
          </div>
        </form>

        <div class="mt-6 text-center text-sm">
          <p class="text-gray-600">
            Already have an account? 
            <router-link to="/login" class="font-medium text-indigo-600 hover:text-indigo-500">Sign in</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AppLogo from '../components/common/AppLogo.vue'
import FormField from '../components/common/FormField.vue'
import BaseButton from '../components/common/BaseButton.vue'
import { validateSignupForm } from '../utils/expenseHelpers.js'
import { register } from '../services/authService'

export default {
  name: 'Signup',
  components: {
    AppLogo,
    FormField,
    BaseButton
  },
  data() {
    return {
      form: { name: '', email: '', password: '', confirmPassword: '' },
      errors: {},
      apiError: '',
      isLoading: false
    }
  },
  methods: {
    async handleSignup() {
      this.apiError = ''
      const validation = validateSignupForm(
        this.form.name,
        this.form.email,
        this.form.password,
        this.form.confirmPassword
      )
      this.errors = validation.errors

      if (!validation.isValid) return

      this.isLoading = true
      try {
        await register(this.form.name, this.form.email, this.form.password)
        this.$router.push('/dashboard')
      } catch (err) {
        this.apiError = err.message || 'Failed to sign up. Please try again.'
      } finally {
        this.isLoading = false
      }
    }
  }
}
</script>
