<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <UFormGroup label="Nome Completo" required>
      <UInput v-model="name" type="text" placeholder="João Silva" icon="i-heroicons-user" />
    </UFormGroup>

    <UFormGroup label="Email" required>
      <UInput
        v-model="email"
        type="email"
        placeholder="seu@email.com"
        icon="i-heroicons-envelope"
      />
    </UFormGroup>

    <UFormGroup label="Senha" required help="Mínimo 6 caracteres para a senha.">
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
      Criar Conta
    </UButton>
  </form>
</template>

<script setup lang="ts">
const { signup, loading } = useAuth()
const email = ref('')
const password = ref('')
const name = ref('')
const error = ref('')

const handleSubmit = async () => {
  error.value = ''

  const { error: authError } = await signup(email.value, password.value, {
    data: {
      full_name: name.value,
    },
  })

  if (authError) {
    error.value = authError
    return
  }

  // Em vez de alert(), já redirecionamos e forçamos o refresh
  // para o Supabase SSR pegar o cookie de sessão imediatamente
  await navigateTo('/', { external: true })
}
</script>
