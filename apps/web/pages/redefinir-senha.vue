<template>
  <div class="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-950">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
        Definir Nova Senha
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
        Escolha uma senha forte com no mínimo 8 caracteres.
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <UCard>
        <form class="space-y-4" @submit.prevent="handleSubmit">
          <UFormGroup label="Nova Senha" required>
            <UInput
              v-model="password"
              type="password"
              placeholder="••••••••"
              icon="i-heroicons-lock-closed"
              autofocus
            />
          </UFormGroup>

          <UFormGroup label="Confirmar Nova Senha" required>
            <UInput
              v-model="confirm"
              type="password"
              placeholder="••••••••"
              icon="i-heroicons-lock-closed"
            />
          </UFormGroup>

          <div
            v-if="validationError"
            class="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-md border border-red-100 dark:bg-red-900/20 dark:border-red-800"
          >
            {{ validationError }}
          </div>

          <UButton
            type="submit"
            block
            color="primary"
            :loading="loading"
            size="lg"
            :disabled="!canSubmit"
          >
            Redefinir Senha
          </UButton>
        </form>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
// O link do e-mail do Supabase cria sessão temporária automaticamente,
// portanto o middleware 'auth' é o correto aqui.
definePageMeta({ middleware: ['auth'] })

const { resetPassword, loading } = useAuth()
const password = ref('')
const confirm = ref('')
const toast = useToast()

const validationError = computed(() => {
  if (password.value && password.value.length < 8) return 'A senha deve ter no mínimo 8 caracteres.'
  if (confirm.value && password.value !== confirm.value) return 'As senhas não coincidem.'
  return ''
})

const canSubmit = computed(() =>
  password.value.length >= 8 && password.value === confirm.value
)

const handleSubmit = async () => {
  if (!canSubmit.value) return
  const { error } = await resetPassword(password.value)
  if (error) {
    toast.add({ title: 'Erro ao redefinir senha', description: error, color: 'red' })
    return
  }
  toast.add({ title: 'Senha redefinida com sucesso!', icon: 'i-heroicons-check-circle', color: 'green' })
  await navigateTo('/login')
}
</script>
