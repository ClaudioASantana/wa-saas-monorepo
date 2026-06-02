<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">
          Roteamento Automático
        </h3>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Configure as regras para distribuição automática de novas conversas.
        </p>
      </div>
      <UButton
        color="primary"
        :loading="saving"
        @click="saveRoutingConfig"
      >
        Salvar Alterações
      </UButton>
    </div>

    <UDivider />

    <div v-if="pending" class="space-y-4">
      <USkeleton class="h-8 w-full max-w-sm" />
      <USkeleton class="h-8 w-full max-w-sm" />
    </div>

    <div v-else class="space-y-8">
      <!-- Round Robin -->
      <div class="flex items-start justify-between">
        <div>
          <h4 class="text-sm font-medium text-gray-900 dark:text-white">Round-Robin</h4>
          <p class="text-sm text-gray-500">
            Distribui as conversas ciclicamente entre os agentes com status "Ativo".
          </p>
        </div>
        <UToggle v-model="config.round_robin_enabled" />
      </div>

      <!-- Retenção -->
      <div>
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-1">Retenção de Atendimento</h4>
        <p class="text-sm text-gray-500 mb-3">
          Tempo em dias para que um contato que retornar seja direcionado ao mesmo agente. 
          Se 0, a retenção é desativada.
        </p>
        <UFormGroup>
          <div class="flex items-center gap-3">
            <UInput
              v-model.number="config.retention_days"
              type="number"
              min="0"
              max="365"
              class="w-32"
            />
            <span class="text-sm text-gray-600">dias</span>
          </div>
        </UFormGroup>
      </div>

      <!-- Tag Routing Placeholder -->
      <div>
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-1">Distribuição por Tags</h4>
        <p class="text-sm text-gray-500 mb-3">
          (Em breve) Atribua conversas automaticamente a um grupo de agentes com base na tag inicial da conversa.
        </p>
        <UAlert
          icon="i-heroicons-information-circle"
          color="gray"
          variant="soft"
          title="Funcionalidade em desenvolvimento"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  workspaceId: string
}>()

const toast = useToast()

const config = ref({
  round_robin_enabled: false,
  retention_days: 7,
  tag_routing: {}
})

const saving = ref(false)

const { pending, refresh } = useAsyncData(`routing-${props.workspaceId}`, async () => {
  try {
    const data = await $fetch(`/api/workspace/${props.workspaceId}/routing`)
    if (data) {
      config.value = {
        round_robin_enabled: data.round_robin_enabled,
        retention_days: data.retention_days,
        tag_routing: data.tag_routing || {}
      }
    }
    return data
  } catch (err: any) {
    if (err?.statusCode !== 404) {
      toast.add({ title: 'Erro ao carregar roteamento', color: 'red' })
    }
    return null
  }
})

const saveRoutingConfig = async () => {
  saving.value = true
  try {
    await $fetch(`/api/workspace/${props.workspaceId}/routing`, {
      method: 'PATCH',
      body: config.value
    })
    toast.add({ title: 'Configurações de roteamento salvas com sucesso!', color: 'green' })
  } catch (e: any) {
    toast.add({ title: 'Erro ao salvar', description: e.statusMessage || e.message, color: 'red' })
  } finally {
    saving.value = false
  }
}
</script>
