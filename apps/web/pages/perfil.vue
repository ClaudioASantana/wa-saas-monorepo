<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 py-8">
    <UContainer max="md">
      <!-- Header -->
      <div class="flex items-center space-x-4 mb-8">
        <UButton
          icon="i-heroicons-arrow-left"
          color="gray"
          variant="ghost"
          @click="goBack"
        />
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
          Meu Perfil
        </h1>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Avatar Section -->
        <UCard class="md:col-span-1">
          <div class="flex flex-col items-center space-y-4">
            <UAvatar
              :src="avatarUrl || undefined"
              :alt="profile?.name"
              size="3xl"
              :ui="{ rounded: 'rounded-full' }"
            />
            
            <div class="text-center w-full">
              <UButton
                color="white"
                variant="solid"
                size="sm"
                icon="i-heroicons-photo"
                :loading="uploading"
                @click="triggerFileInput"
              >
                Alterar Foto
              </UButton>
              <input
                ref="fileInput"
                type="file"
                class="hidden"
                accept="image/jpeg, image/png, image/webp"
                @change="uploadAvatar"
              >
              <p class="text-xs text-slate-500 mt-2">
                JPG, PNG ou WebP. Máx 2MB.
              </p>
            </div>
          </div>
        </UCard>

        <!-- Form Section -->
        <div class="md:col-span-2 space-y-6">
          <!-- Profile Data -->
          <UCard>
            <template #header>
              <h2 class="text-lg font-medium text-slate-900 dark:text-white">
                Informações Pessoais
              </h2>
            </template>
            
            <UForm
              :state="profileState"
              :schema="profileSchema"
              class="space-y-4"
              @submit="saveProfile"
            >
              <UFormGroup
                label="E-mail"
                name="email"
              >
                <UInput
                  v-model="profileState.email"
                  disabled
                  icon="i-heroicons-envelope"
                />
              </UFormGroup>

              <UFormGroup
                label="Nome Completo"
                name="name"
              >
                <UInput
                  v-model="profileState.name"
                  icon="i-heroicons-user"
                />
              </UFormGroup>

              <UFormGroup
                label="Telefone"
                name="phone"
              >
                <UInput
                  v-model="profileState.phone"
                  icon="i-heroicons-phone"
                  placeholder="+55 11 99999-9999"
                />
              </UFormGroup>

              <div class="flex justify-end pt-2">
                <UButton
                  type="submit"
                  color="primary"
                  :loading="savingProfile"
                >
                  Salvar Alterações
                </UButton>
              </div>
            </UForm>
          </UCard>

          <!-- Password -->
          <UCard>
            <template #header>
              <h2 class="text-lg font-medium text-slate-900 dark:text-white">
                Alterar Senha
              </h2>
            </template>

            <UForm
              :state="passwordState"
              :schema="passwordSchema"
              class="space-y-4"
              @submit="savePassword"
            >
              <!-- Note: Supabase auth.updateUser doesn't natively require current password for simple updates,
                   but we include it for UI completeness if needed later for re-auth. -->
              <UFormGroup
                label="Senha Atual"
                name="currentPassword"
              >
                <UInput
                  v-model="passwordState.currentPassword"
                  type="password"
                  icon="i-heroicons-lock-closed"
                />
              </UFormGroup>

              <UFormGroup
                label="Nova Senha"
                name="newPassword"
              >
                <UInput
                  v-model="passwordState.newPassword"
                  type="password"
                  icon="i-heroicons-key"
                />
              </UFormGroup>

              <UFormGroup
                label="Confirmar Nova Senha"
                name="confirmPassword"
              >
                <UInput
                  v-model="passwordState.confirmPassword"
                  type="password"
                  icon="i-heroicons-check-circle"
                />
              </UFormGroup>

              <div class="flex justify-end pt-2">
                <UButton
                  type="submit"
                  color="primary"
                  :loading="savingPassword"
                >
                  Atualizar Senha
                </UButton>
              </div>
            </UForm>
          </UCard>
        </div>
      </div>
    </UContainer>
  </div>
</template>

import { z } from 'zod'

definePageMeta({
  middleware: 'auth'
})

const { currentUser, fetchUser } = useAuth()
const config = useRuntimeConfig()
const toast = useToast()
const router = useRouter()

const goBack = () => {
  router.back()
}

// ----------------------------------------------------------------------------
// Profile State
// ----------------------------------------------------------------------------
const profile = computed(() => currentUser.value)

const profileState = reactive({
  email: currentUser.value?.email || '',
  name: currentUser.value?.name || '',
  phone: '', // Phone was in profiles, maybe not in agents yet, we'll keep the field
})

const profileSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  phone: z.string().optional(),
})

const savingProfile = ref(false)

const loadProfile = async () => {
  if (currentUser.value) {
    profileState.email = currentUser.value.email || ''
    profileState.name = currentUser.value.name || ''
    // If phone is added to agents, fetch it here
  }
}

onMounted(loadProfile)

const saveProfile = async () => {
  savingProfile.value = true
  try {
    await $fetch(`${config.public.apiUrl}/agents/me`, {
      method: 'PUT',
      body: {
        full_name: profileState.name,
      }
    })
    toast.add({ title: 'Perfil atualizado com sucesso!', color: 'green' })
    await fetchUser() // Atualiza o state global do auth
    await loadProfile() // Refresh
  } catch (error: any) {
    toast.add({ title: 'Erro ao atualizar perfil', description: error.data?.error || error.message, color: 'red' })
  } finally {
    savingProfile.value = false
  }
}

// ----------------------------------------------------------------------------
// Password State
// ----------------------------------------------------------------------------
const passwordState = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'A senha atual é obrigatória'),
  newPassword: z.string().min(6, 'A nova senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword']
})

const savingPassword = ref(false)

const savePassword = async () => {
  savingPassword.value = true
  try {
    // API não implementada ainda para alterar senha localmente
    toast.add({ title: 'Alteração de senha em breve', description: 'Esta funcionalidade será migrada para a nova API.', color: 'yellow' })
  } catch (error: any) {
    toast.add({ title: 'Erro ao alterar senha', description: error.message, color: 'red' })
  } finally {
    savingPassword.value = false
  }
}

// ----------------------------------------------------------------------------
// Avatar Upload
// ----------------------------------------------------------------------------
const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

// Placeholder for avatar URL since Supabase Storage is gone
const avatarUrl = computed(() => {
  return null
})

const triggerFileInput = () => {
  fileInput.value?.click()
}

const uploadAvatar = async (event: Event) => {
  toast.add({ title: 'Upload em breve', description: 'Upload de avatar será implementado na nova infraestrutura.', color: 'yellow' })
}
</script>
