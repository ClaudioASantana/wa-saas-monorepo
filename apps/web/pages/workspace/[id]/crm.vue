<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div
      class="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex justify-between items-center"
    >
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">CRM Kanban</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Gerencie seus leads e oportunidades do WhatsApp.
        </p>
      </div>
      <div class="flex space-x-3">
        <USelectMenu
          :options="['Funil Principal', 'Funil Suporte']"
          placeholder="Selecionar Funil"
          class="w-48"
        />
        <UButton icon="i-heroicons-plus" color="primary">Nova Oportunidade</UButton>
      </div>
    </div>

    <!-- Kanban Board Area (Horizontal Scroll) -->
    <div class="flex-1 overflow-x-auto p-6 bg-slate-50 dark:bg-slate-950">
      <div class="flex space-x-6 min-w-max h-full">
        <!-- Coluna 1 -->
        <div class="w-80 flex flex-col space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-slate-700 dark:text-slate-300 flex items-center">
              <span class="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
              Novos Leads
              <UBadge color="gray" variant="subtle" size="xs" class="ml-2">3</UBadge>
            </h3>
            <UButton
              icon="i-heroicons-ellipsis-horizontal"
              color="gray"
              variant="ghost"
              size="xs"
            />
          </div>

          <!-- Cards Área -->
          <div class="flex-1 space-y-3">
            <UCard
              v-for="i in 3"
              :key="i"
              class="cursor-pointer hover:ring-1 hover:ring-primary-500 transition-shadow"
            >
              <div class="space-y-2">
                <div class="flex justify-between items-start">
                  <h4 class="text-sm font-semibold text-slate-900 dark:text-white">
                    João da Silva
                  </h4>
                  <UAvatar size="xs" src="https://avatars.githubusercontent.com/u/739984?v=4" />
                </div>
                <p class="text-xs text-slate-500">R$ 1.500,00</p>
                <div class="flex space-x-1">
                  <UBadge color="primary" variant="subtle" size="xs">WhatsApp</UBadge>
                </div>
              </div>
            </UCard>
          </div>
        </div>

        <!-- Coluna 2 -->
        <div class="w-80 flex flex-col space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-slate-700 dark:text-slate-300 flex items-center">
              <span class="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>
              Em Negociação
              <UBadge color="gray" variant="subtle" size="xs" class="ml-2">1</UBadge>
            </h3>
            <UButton
              icon="i-heroicons-ellipsis-horizontal"
              color="gray"
              variant="ghost"
              size="xs"
            />
          </div>

          <div class="flex-1 space-y-3">
            <UCard class="cursor-pointer hover:ring-1 hover:ring-primary-500 transition-shadow">
              <div class="space-y-2">
                <div class="flex justify-between items-start">
                  <h4 class="text-sm font-semibold text-slate-900 dark:text-white">Empresa Alfa</h4>
                  <UAvatar size="xs" src="https://avatars.githubusercontent.com/u/739984?v=4" />
                </div>
                <p class="text-xs text-slate-500">R$ 4.200,00</p>
                <div class="flex space-x-1">
                  <UBadge color="red" variant="subtle" size="xs">Quente</UBadge>
                </div>
              </div>
            </UCard>
          </div>
        </div>

        <!-- Coluna 3 -->
        <div class="w-80 flex flex-col space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-slate-700 dark:text-slate-300 flex items-center">
              <span class="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
              Fechado
              <UBadge color="gray" variant="subtle" size="xs" class="ml-2">0</UBadge>
            </h3>
            <UButton
              icon="i-heroicons-ellipsis-horizontal"
              color="gray"
              variant="ghost"
              size="xs"
            />
          </div>

          <div
            class="flex-1 space-y-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center min-h-[150px]"
          >
            <span class="text-sm text-slate-400">Arraste cards para cá</span>
          </div>
        </div>

        <!-- Adicionar Nova Coluna -->
        <div class="w-80">
          <UButton
            block
            color="gray"
            variant="ghost"
            icon="i-heroicons-plus"
            class="h-12 border border-dashed border-slate-300 dark:border-slate-700"
          >
            Nova Fase
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'workspace',
  middleware: ['auth'],
})
</script>
