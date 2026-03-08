<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <UFormGroup label="Email" required>
      <UInput
        v-model="email"
        type="email"
        placeholder="seu@email.com"
        icon="i-heroicons-envelope"
      />
    </UFormGroup>

    <UFormGroup label="Senha" required>
      <UInput
        v-model="password"
        type="password"
        placeholder="••••••••"
        icon="i-heroicons-lock-closed"
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
const supabase = useSupabaseClient()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const handleSubmit = async () => {
  loading.value = true
  error.value = ''

  try {
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })

    if (authError) throw authError

    // Nuxt Supabase precisa propagar o cookie de sessão antes do middleware agir.
    // Usamos um refresh completo ou `navigateTo` com `external: true`
    await navigateTo('/', { external: true })
  } catch (e: any) {
    error.value = e.message || 'Erro ao fazer login. Verifique suas credenciais.'
  } finally {
    loading.value = false
  }
}
</script>
