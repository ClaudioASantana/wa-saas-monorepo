<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <UFormGroup label="Email" required>
      <UInput
        v-model="email"
        type="email"
        placeholder="seu@email.com"
        icon="i-heroicons-envelope"
        :disabled="loading"
      />
    </UFormGroup>

    <UFormGroup label="Senha" required>
      <UInput
        v-model="password"
        type="password"
        placeholder="••••••••"
        icon="i-heroicons-lock-closed"
        :disabled="loading"
      />
    </UFormGroup>

    <div
      v-if="error"
      class="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-md border border-red-100 dark:bg-red-900/20 dark:border-red-800"
    >
      {{ error }}
    </div>

    <UButton type="submit" block color="primary" :loading="loading" size="lg" class="mt-4">
      Entrar na Plataforma
    </UButton>

    <div class="text-sm text-center mt-6">
      <NuxtLink
        to="/esqueci-senha"
        class="text-primary-600 hover:text-primary-500 font-medium transition-colors"
      >
        Esqueceu sua senha?
      </NuxtLink>
    </div>
  </form>
</template>

<script setup lang="ts">
const { login, loading } = useAuth()
const email = ref('')
const password = ref('')
const error = ref('')

const handleSubmit = async () => {
  error.value = ''

  const { error: authError } = await login(email.value, password.value)

  if (authError) {
    error.value = authError
    return
  }

  // Redirecionar para home usando navigateTo do Nuxt (mantém SPA)
  await navigateTo('/', { replace: true })
}
</script>
