<template>
  <div class="flex gap-4 overflow-x-auto h-[calc(100vh-200px)] pb-4 w-full snap-x">
    <div 
      v-for="stage in localStages" 
      :key="stage.id" 
      class="flex-shrink-0 w-80 bg-gray-50 dark:bg-gray-900 rounded-lg flex flex-col snap-start border border-gray-200 dark:border-gray-800"
    >
      <!-- Column Header -->
      <div class="p-3 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
        <div class="flex items-center gap-2">
          <div
            class="w-3 h-3 rounded-full"
            :class="`bg-${stage.color || 'blue'}-500`"
          />
          <h3 class="font-semibold text-gray-700 dark:text-gray-200">
            {{ stage.name }}
          </h3>
          <UBadge
            color="gray"
            variant="soft"
            size="xs"
          >
            {{ stage.crm_cards?.length || 0 }}
          </UBadge>
        </div>
      </div>

      <!-- Draggable Area -->
      <div class="p-2 flex-1 overflow-y-auto">
        <VueDraggable
          v-model="stage.crm_cards"
          group="kanban"
          item-key="id"
          class="min-h-[150px] space-y-2"
          ghost-class="opacity-50"
          drag-class="rotate-2 scale-105 transition-transform"
          @end="onDragEnd($event, stage.id)"
        >
          <template #item="{ element }">
            <KanbanCard 
              :card="element"
              :has-new-messages="element.hasNewMessages"
              @remove="$emit('remove-card', element.id)" 
              @open-chat="$emit('open-chat', $event)"
            />
          </template>
        </VueDraggable>
      </div>
      
      <!-- Add Button -->
      <div class="p-2 border-t border-gray-200 dark:border-gray-800">
        <UButton 
          block 
          color="gray" 
          variant="ghost" 
          icon="i-heroicons-plus"
          @click="$emit('add-conversation', stage.id)"
        >
          Adicionar
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import KanbanCard from './KanbanCard.vue'

const props = defineProps({
  stages: {
    type: Array as () => any[],
    required: true
  }
})

const emit = defineEmits(['update-card-stage', 'remove-card', 'add-conversation', 'open-chat'])

// Clone to avoid mutating props directly during drag
const localStages = ref<any[]>([])

watch(() => props.stages, (newStages) => {
  localStages.value = JSON.parse(JSON.stringify(newStages))
}, { deep: true, immediate: true })

const onDragEnd = (event: any, fromStageId: string) => {
  // Logic to identify moved item and emit event to parent
  const { to, from, item, newIndex, oldIndex } = event
  
  // Since VueDraggable updates the v-model directly, localStages is updated.
  // We just need to find the card and notify the backend
  
  // If we moved within the same list, position might have changed
  // If we moved to another list, stage_id and position changed
  
  // Find which stage it was moved to by inspecting localStages
  for (const stage of localStages.value) {
    const cardIndex = stage.crm_cards.findIndex((c: any) => c.id === item.dataset.key || c.id === item.__draggable_context?.element?.id)
    if (cardIndex !== -1) {
      const card = stage.crm_cards[cardIndex]
      
      let newPosition = 1024
      const prevCard = stage.crm_cards[cardIndex - 1]
      const nextCard = stage.crm_cards[cardIndex + 1]
      
      if (prevCard && nextCard) {
        newPosition = Math.floor((prevCard.position + nextCard.position) / 2)
      } else if (prevCard) {
        newPosition = prevCard.position + 1024
      } else if (nextCard) {
        newPosition = Math.floor(nextCard.position / 2)
      }

      // Just emit update request
      emit('update-card-stage', {
        cardId: card.id,
        stageId: stage.id,
        position: newPosition
      })
      break
    }
  }
}
</script>
