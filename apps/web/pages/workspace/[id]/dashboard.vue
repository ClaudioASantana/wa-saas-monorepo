<template>
  <div class="p-6 max-w-7xl mx-auto space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Dashboard do Workspace</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">Visão geral das suas métricas.</p>
      </div>
    </div>

    <!-- Metrics Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <UCard>
        <div class="flex flex-col">
          <span class="text-sm font-medium text-slate-500">Conversas Ativas</span>
          <span class="text-3xl font-bold text-slate-900 dark:text-white mt-1">12</span>
        </div>
      </UCard>

      <UCard>
        <div class="flex flex-col">
          <span class="text-sm font-medium text-slate-500">Novos Leads Hoje</span>
          <span class="text-3xl font-bold text-slate-900 dark:text-white mt-1">5</span>
        </div>
      </UCard>

      <UCard>
        <div class="flex flex-col">
          <span class="text-sm font-medium text-slate-500">Tempo Médio de Resposta</span>
          <span class="text-3xl font-bold text-slate-900 dark:text-white mt-1">4m</span>
        </div>
      </UCard>

      <UCard>
        <div class="flex flex-col">
          <span class="text-sm font-medium text-slate-500">Vendas (Kanban)</span>
          <span class="text-3xl font-bold text-slate-900 dark:text-white mt-1">R$ 4.2k</span>
        </div>
      </UCard>
    </div>

    <!-- Empty State for Features -->
    <UCard class="mt-8 bg-slate-100/50 dark:bg-slate-800/50 border-dashed">
      <div class="text-center py-12">
        <UIcon name="i-heroicons-chart-bar" class="mx-auto h-12 w-12 text-slate-400" />
        <h3 class="mt-2 text-sm font-semibold text-slate-900 dark:text-white">Gráficos em Breve</h3>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Estamos construindo o motor de BI para exibir suas estatísticas avançadas.
        </p>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'workspace',
  middleware: ['auth'],
})
</script>
