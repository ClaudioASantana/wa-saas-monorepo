<template>
  <div
    class="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-950"
  >
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
        Bem-vindo ao CRM
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
        {{ isLogin ? 'Entre na sua conta' : 'Crie sua conta' }}
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <UCard>
        <!-- Toggle Tabs -->
        <div class="flex border-b border-gray-200 dark:border-gray-800 mb-6">
          <button
            type="button"
            class="flex-1 py-2 text-center font-medium text-sm transition-colors"
            :class="
              isLogin
                ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            "
            @click="switchTab(true)"
          >
            Login
          </button>
          <button
            type="button"
            class="flex-1 py-2 text-center font-medium text-sm transition-colors"
            :class="
              !isLogin
                ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            "
            @click="switchTab(false)"
          >
            Cadastro
          </button>
        </div>

        <!-- Render Form Dynamically -->
        <LoginForm v-if="isLogin" />
        <RegisterForm v-else />
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import LoginForm from '~/components/login/LoginForm.vue'
import RegisterForm from '~/components/login/RegisterForm.vue'

// Prevent logged in users from seeing login page
definePageMeta({
  middleware: ['guest'],
})

const isLogin = ref(true)

const switchTab = (val: boolean) => {
  isLogin.value = val
}
</script>
