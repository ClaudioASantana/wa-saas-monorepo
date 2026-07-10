<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <UFormGroup label="Nome Completo" required>
      <UInput
        v-model="name"
        type="text"
        placeholder="João Silva"
        icon="i-heroicons-user"
        :disabled="loading"
      />
    </UFormGroup>

    <UFormGroup label="Nome da Empresa (Workspace)" required>
      <UInput
        v-model="tenantName"
        type="text"
        placeholder="Minha Empresa"
        icon="i-heroicons-building-office"
        :disabled="loading"
      />
    </UFormGroup>

    <UFormGroup
      label="Identificador Único (Slug)"
      required
      help="Usado para a URL e identificação do seu workspace. Apenas letras minúsculas sem espaço."
    >
      <UInput
        v-model="tenantSlug"
        type="text"
        placeholder="minha-empresa"
        icon="i-heroicons-link"
        :disabled="loading"
      />
    </UFormGroup>

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
      <div class="text-xs text-gray-500 mt-1">
        <p>A senha deve conter:</p>
        <ul class="list-disc list-inside">
          <li>Mínimo 8 caracteres</li>
          <li>Letra maiúscula</li>
          <li>Letra minúscula</li>
          <li>Número</li>
          <li>Caractere especial (!@#$%^&*)</li>
        </ul>
      </div>
    </UFormGroup>

    <div
      v-if="error"
      class="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-md border border-red-100 dark:bg-red-900/20 dark:border-red-800"
    >
      {{ error }}
    </div>

    <UButton type="submit" block color="primary" :loading="loading" size="lg" class="mt-4">
      Criar Conta e Workspace
    </UButton>
  </form>
</template>

<script setup lang="ts">
const { register, loading } = useAuth()
const email = ref('')
const password = ref('')
const name = ref('')
const tenantName = ref('')
const tenantSlug = ref('')
const error = ref('')

const handleSubmit = async () => {
  error.value = ''

  if (!tenantSlug.value.match(/^[a-z0-9-]+$/)) {
    error.value = 'Slug deve conter apenas letras minúsculas, números e hífens'
    return
  }

  const { error: authError } = await register(
    email.value,
    password.value,
    name.value,
    tenantName.value,
    tenantSlug.value
  )

  if (authError) {
    error.value = authError
    return
  }

  // Redirecionar para home após registro bem-sucedido (mantém SPA)
  await navigateTo('/', { replace: true })
}
</script>
