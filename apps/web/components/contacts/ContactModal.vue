<!-- apps/web/components/contacts/ContactModal.vue -->
<template>
  <UModal
    :model-value="open"
    @update:model-value="!$event && emit('close')"
  >
    <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold text-gray-900 dark:text-white">
            {{ contact?.name || contact?.phone || 'Contato' }}
          </h3>
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark"
            size="sm"
            @click="emit('close')"
          />
        </div>
      </template>

      <div
        v-if="contact"
        class="space-y-4 py-2"
      >
        <UFormGroup label="Nome">
          <UInput
            v-model="form.name"
            placeholder="Nome do contato"
          />
        </UFormGroup>

        <UFormGroup label="Telefone">
          <UInput
            v-model="form.phone"
            placeholder="+55 11 99999-9999"
          />
        </UFormGroup>

        <UFormGroup label="Notas">
          <UTextarea
            v-model="form.notes"
            placeholder="Observações sobre o contato..."
            :rows="4"
          />
        </UFormGroup>

        <UFormGroup label="Status">
          <div class="flex items-center gap-3">
            <UToggle v-model="form.is_active" />
            <span class="text-sm text-slate-700 dark:text-slate-300">
              {{ form.is_active ? 'Ativo' : 'Inativo' }}
            </span>
          </div>
        </UFormGroup>
      </div>

      <template #footer>
        <div class="flex items-center justify-between">
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-chat-bubble-left-right"
            @click="goToConversation"
          >
            Ver Conversa
          </UButton>
          <div class="flex gap-3">
            <UButton
              color="gray"
              variant="ghost"
              @click="emit('close')"
            >
              Cancelar
            </UButton>
            <UButton
              color="primary"
              icon="i-heroicons-check"
              :loading="saving"
              :disabled="!contact"
              @click="save"
            >
              Salvar
            </UButton>
          </div>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
interface ContactRow {
  id: string
  name: string | null
  phone: string
  notes: string | null
  is_active: boolean
  updated_at: string
  lastConversationAt: string | null
}

const props = defineProps<{
  contact: ContactRow | null
  open: boolean
}>()

const emit = defineEmits<{
  close: []
  saved: [contact: ContactRow]
}>()

const route = useRoute()
const workspaceId = computed(() => route.params.id as string)
const toast = useToast()
const saving = ref(false)

const { token } = useAuth()
const config = useRuntimeConfig()
const API_URL = config.public.apiUrl as string

// Form state — reinitializes when contact changes
const form = reactive({
  name: '',
  phone: '',
  notes: '',
  is_active: true,
})

watch(
  () => props.contact,
  (c) => {
    if (c) {
      form.name = c.name ?? ''
      form.phone = c.phone
      form.notes = c.notes ?? ''
      form.is_active = c.is_active
    }
  },
  { immediate: true }
)

async function save() {
  if (!props.contact) return
  saving.value = true
  try {
    const updated = await $fetch<ContactRow>(`${API_URL}/contacts/${props.contact.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token.value}` },
      body: {
        name: form.name || undefined,
        phone: form.phone || undefined,
        notes: form.notes,
        is_active: form.is_active,
      },
    })
    toast.add({
      title: 'Contato atualizado',
      icon: 'i-heroicons-check-circle',
      color: 'green',
    })
    emit('saved', { ...props.contact, ...updated })
  } catch (error) {
    console.error('[ContactModal] save failed:', error)
    toast.add({
      title: 'Erro ao salvar contato',
      icon: 'i-heroicons-x-circle',
      color: 'red',
    })
  } finally {
    saving.value = false
  }
}

function goToConversation() {
  if (!props.contact) return
  navigateTo(`/workspace/${workspaceId.value}/chat?contactId=${props.contact.id}`)
  emit('close')
}
</script>
