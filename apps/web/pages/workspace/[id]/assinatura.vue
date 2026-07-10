<script setup lang="ts">
import type { Database } from '~/types/database.types'

const route = useRoute()
const workspaceId = route.params.id as string
const toast = useToast()

const supabase = useSupabaseClient<Database>()

const { data: workspace, pending } = await useAsyncData(`workspace-${workspaceId}`, async () => {
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', workspaceId)
    .single()
  
  if (error) throw error
  return data
})

const loadingCheckout = ref(false)
const loadingPortal = ref(false)

const handleCheckout = async (plan: string) => {
  loadingCheckout.value = true
  try {
    const res = await $fetch<{ url: string }>('/api/billing/checkout', {
      method: 'POST',
      body: { plan, workspaceId }
    })
    if (res.url) {
      window.location.href = res.url
    }
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.data?.message || 'Falha ao iniciar checkout', color: 'red' })
  } finally {
    loadingCheckout.value = false
  }
}

const handlePortal = async () => {
  loadingPortal.value = true
  try {
    const res = await $fetch<{ url: string }>('/api/billing/portal', {
      method: 'POST',
      body: { workspaceId }
    })
    if (res.url) {
      window.location.href = res.url
    }
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.data?.message || 'Falha ao acessar portal', color: 'red' })
  } finally {
    loadingPortal.value = false
  }
}

// Display plan names
const planName = computed(() => {
  if (workspace.value?.plan === 'pro') return 'Pro'
  return 'Starter'
})

const isPro = computed(() => workspace.value?.plan === 'pro')
const hasActiveSubscription = computed(() => {
  return workspace.value?.subscription_status === 'active' || workspace.value?.subscription_status === 'trialing'
})
const isCanceled = computed(() => workspace.value?.subscription_status === 'canceled')

onMounted(() => {
  if (route.query.success) {
    toast.add({ title: 'Sucesso', description: 'Assinatura atualizada com sucesso!', color: 'green' })
    const router = useRouter()
    router.replace({ query: {} })
  }
  if (route.query.canceled) {
    toast.add({ title: 'Aviso', description: 'Checkout cancelado.', color: 'orange' })
    const router = useRouter()
    router.replace({ query: {} })
  }
})
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Assinatura e Pagamento
      </h1>
      <p class="text-gray-500 dark:text-gray-400 mt-1">
        Gerencie seu plano e limite de agentes.
      </p>
    </div>

    <div
      v-if="pending"
      class="flex justify-center p-8"
    >
      <UIcon
        name="i-heroicons-arrow-path"
        class="w-8 h-8 animate-spin text-gray-400"
      />
    </div>

    <div
      v-else-if="workspace"
      class="grid grid-cols-1 md:grid-cols-2 gap-6"
    >
      <!-- Current Plan Card -->
      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold">
            Seu Plano Atual
          </h2>
        </template>

        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-gray-500 dark:text-gray-400">Plano</span>
            <UBadge
              :color="isPro ? 'primary' : 'gray'"
              size="lg"
            >
              {{ planName }}
            </UBadge>
          </div>
          
          <div class="flex items-center justify-between">
            <span class="text-gray-500 dark:text-gray-400">Status</span>
            <UBadge
              v-if="hasActiveSubscription"
              color="green"
            >
              Ativo
            </UBadge>
            <UBadge
              v-else-if="isCanceled"
              color="red"
            >
              Cancelado / Expirado
            </UBadge>
            <UBadge
              v-else
              color="gray"
            >
              Gratuito / Sem assinatura
            </UBadge>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-gray-500 dark:text-gray-400">Agentes Permitidos</span>
            <span class="font-medium">{{ isPro ? 'Ilimitado' : 'Até 3 agentes' }}</span>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end space-x-3">
            <UButton 
              v-if="workspace.stripe_customer_id" 
              color="gray" 
              variant="soft" 
              icon="i-heroicons-arrow-top-right-on-square"
              :loading="loadingPortal"
              @click="handlePortal"
            >
              Portal do Cliente (Faturas/Cartão)
            </UButton>
          </div>
        </template>
      </UCard>

      <!-- Upgrade/Downgrade Card -->
      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold">
            Mudar de Plano
          </h2>
        </template>
        
        <div class="space-y-4">
          <p class="text-sm text-gray-600 dark:text-gray-300">
            O plano <strong>Starter</strong> permite até 3 agentes. O plano <strong>Pro</strong> não tem limites.
          </p>
          
          <div class="flex gap-4">
            <UCard
              class="flex-1 cursor-pointer border-2 hover:border-primary-500 transition-colors"
              :class="{'border-primary-500 ring-1 ring-primary-500': !isPro, 'border-gray-200 dark:border-gray-800': isPro}"
            >
              <div class="text-center">
                <h3 class="font-bold mb-2">
                  Starter
                </h3>
                <UButton
                  v-if="isPro"
                  block
                  color="gray"
                  :loading="loadingCheckout"
                  @click="handleCheckout('starter')"
                >
                  Fazer Downgrade
                </UButton>
                <UBadge
                  v-else
                  color="green"
                  class="w-full justify-center"
                >
                  Plano Atual
                </UBadge>
              </div>
            </UCard>
            
            <UCard
              class="flex-1 cursor-pointer border-2 hover:border-primary-500 transition-colors"
              :class="{'border-primary-500 ring-1 ring-primary-500': isPro, 'border-gray-200 dark:border-gray-800': !isPro}"
            >
              <div class="text-center">
                <h3 class="font-bold mb-2 text-primary-500">
                  Pro
                </h3>
                <UButton
                  v-if="!isPro"
                  block
                  color="primary"
                  :loading="loadingCheckout"
                  @click="handleCheckout('pro')"
                >
                  Fazer Upgrade
                </UButton>
                <UBadge
                  v-else
                  color="green"
                  class="w-full justify-center"
                >
                  Plano Atual
                </UBadge>
              </div>
            </UCard>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
