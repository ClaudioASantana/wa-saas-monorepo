<template>
  <div class="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-950">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
        Recuperar Senha
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
        Informe seu e-mail e enviaremos um link de redefinição.
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <UCard>
        <form
          v-if="!sent"
          class="space-y-4"
          @submit.prevent="handleSubmit"
        >
          <UFormGroup
            label="E-mail"
            required
          >
            <UInput
              v-model="email"
              type="email"
              placeholder="seu@email.com"
              icon="i-heroicons-envelope"
              autofocus
            />
          </UFormGroup>

          <div
            v-if="error"
            class="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-md border border-red-100 dark:bg-red-900/20 dark:border-red-800"
          >
            {{ error }}
          </div>

          <UButton
            type="submit"
            block
            color="primary"
            :loading="loading"
            size="lg"
          >
            Enviar Link de Recuperação
          </UButton>

          <div class="text-sm text-center mt-4">
            <NuxtLink
              to="/login"
              class="text-primary-600 hover:text-primary-500 font-medium transition-colors"
            >
              Voltar para o login
            </NuxtLink>
          </div>
        </form>

        <div
          v-else
          class="text-center space-y-4 py-4"
        >
          <UIcon
            name="i-heroicons-envelope-open"
            class="w-12 h-12 text-primary-500 mx-auto"
          />
          <p class="text-slate-700 dark:text-slate-300 font-medium">
            Se este e-mail estiver cadastrado, você receberá um link em breve.
          </p>
          <p class="text-sm text-slate-500">
            Verifique também sua caixa de spam.
          </p>
          <NuxtLink
            to="/login"
            class="text-primary-600 hover:text-primary-500 text-sm font-medium transition-colors"
          >
            Voltar para o login
          </NuxtLink>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['guest'] })

const { forgotPassword, loading } = useAuth()
const email = ref('')
const error = ref('')
const sent = ref(false)

const handleSubmit = async () => {
  error.value = ''
  const { error: err } = await forgotPassword(email.value)
  if (err) {
    error.value = 'Ocorreu um erro. Tente novamente.'
    return
  }
  sent.value = true
}
</script>
