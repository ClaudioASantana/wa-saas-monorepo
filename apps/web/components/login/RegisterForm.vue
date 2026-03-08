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
const supabase = useSupabaseClient()
const email = ref('')
const password = ref('')
const name = ref('')
const loading = ref(false)
const error = ref('')

const handleSubmit = async () => {
  loading.value = true
  error.value = ''

  try {
    const { error: authError } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
      options: {
        data: {
          full_name: name.value,
        },
      },
    })

    if (authError) throw authError

    // Em vez de alert(), já redirecionamos e forçamos o refresh
    // para o Supabase SSR pegar o cookie de sessão imediatamente
    await navigateTo('/', { external: true })
  } catch (e: any) {
    error.value = e.message || 'Erro ao criar conta. Tente novamente mais tarde.'
  } finally {
    loading.value = false
  }
}
</script>
