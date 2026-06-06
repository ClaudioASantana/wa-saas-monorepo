<script setup lang="ts">
import { ref } from 'vue'

const features = [
  {
    title: 'CRM Kanban Integrado',
    description: 'Transforme o caos do WhatsApp em um funil visual de vendas. Mova conversas como cards no Trello.',
    icon: 'i-heroicons-view-columns',
    colSpan: 'col-span-1 md:col-span-2',
  },
  {
    title: 'Smart Routing',
    description: 'Distribua leads automaticamente para o time via Round-Robin.',
    icon: 'i-heroicons-arrows-right-left',
    colSpan: 'col-span-1',
  },
  {
    title: 'Multi-Agentes',
    description: 'Sua equipe inteira no mesmo número, sem pagar licenças abusivas de API oficial.',
    icon: 'i-heroicons-user-group',
    colSpan: 'col-span-1',
  },
  {
    title: 'Monitoramento Real-time',
    description: 'Acompanhe quem está online e digitando ao vivo via Websockets de alta performance.',
    icon: 'i-heroicons-chart-bar-square',
    colSpan: 'col-span-1 md:col-span-2',
  }
]
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-white font-sans selection:bg-primary-500/30">
    <!-- Navbar -->
    <header class="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
      <div class="container mx-auto px-4 h-16 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
            <UIcon name="i-heroicons-chat-bubble-bottom-center-text" class="text-white w-5 h-5" />
          </div>
          <span class="font-bold text-xl tracking-tight">Flux CRM</span>
        </div>
        <nav class="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#features" class="hover:text-white transition-colors">Features</a>
          <a href="#pricing" class="hover:text-white transition-colors">Preços</a>
          <a href="#faq" class="hover:text-white transition-colors">FAQ</a>
        </nav>
        <div class="flex items-center gap-4">
          <!-- TODO: Direcionar para a porta 3000 em dev ou subdominio em prod -->
          <UButton variant="ghost" color="gray" to="http://localhost:3000/login" class="hidden sm:inline-flex text-slate-300 hover:text-white">
            Login
          </UButton>
          <UButton color="primary" to="http://localhost:3000/register" icon="i-heroicons-rocket-launch" trailing>
            Começar Grátis
          </UButton>
        </div>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="relative pt-32 pb-20 overflow-hidden">
      <!-- Glow Backgrounds -->
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary-600/20 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div class="container mx-auto px-4 text-center relative z-10 max-w-4xl">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-medium mb-8">
          <UIcon name="i-heroicons-sparkles" class="w-4 h-4" />
          <span>O jeito moderno de atender no WhatsApp</span>
        </div>
        
        <h1 class="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
          Escale seu Atendimento <br class="hidden md:block" />
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-indigo-400">10x Mais Rápido</span>
        </h1>
        
        <p class="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Nossa plataforma multi-agentes conecta toda a sua equipe a um único número de WhatsApp, integrando um CRM Kanban poderoso sem cobrar o preço abusivo da API Oficial.
        </p>
        
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <UButton size="xl" color="primary" class="w-full sm:w-auto px-8" to="http://localhost:3000/register">
            Criar Workspace Grátis
          </UButton>
          <UButton size="xl" color="gray" variant="solid" class="w-full sm:w-auto px-8 bg-slate-800 hover:bg-slate-700 text-white border-none">
            Falar com Vendas
          </UButton>
        </div>
        
        <div class="mt-10 flex items-center justify-center gap-6 text-sm text-slate-500 font-medium">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-emerald-500" />
            <span>Setup em 2 minutos</span>
          </div>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-emerald-500" />
            <span>Cancele quando quiser</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Bento Grid Features -->
    <section id="features" class="py-24 bg-slate-900/50 border-t border-white/5">
      <div class="container mx-auto px-4 max-w-6xl">
        <div class="text-center mb-16">
          <h2 class="text-3xl md:text-4xl font-bold mb-4">Tudo o que sua agência precisa</h2>
          <p class="text-slate-400 max-w-2xl mx-auto">Construído com tecnologia de ponta (Websockets) para que você não perca nenhum lead e nunca mais sofra com quedas de conexão.</p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            v-for="(feature, index) in features" 
            :key="index"
            :class="[
              'rounded-3xl p-8 border border-white/10 bg-slate-900/40 backdrop-blur transition-all hover:bg-slate-800/50 hover:border-primary-500/30 group',
              feature.colSpan
            ]"
          >
            <div class="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary-500/20 group-hover:text-primary-400 transition-all duration-300">
              <UIcon :name="feature.icon" class="w-6 h-6 text-slate-300 group-hover:text-primary-400" />
            </div>
            <h3 class="text-xl font-bold mb-3">{{ feature.title }}</h3>
            <p class="text-slate-400 leading-relaxed">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="py-24 relative overflow-hidden">
      <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none"></div>
      
      <div class="container mx-auto px-4 max-w-5xl relative z-10">
        <div class="text-center mb-16">
          <h2 class="text-3xl md:text-4xl font-bold mb-4">Preços simples e transparentes</h2>
          <p class="text-slate-400">Pague apenas pelo que usar. Sem taxas escondidas de setup.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <!-- Starter Plan -->
          <div class="rounded-3xl p-8 border border-white/10 bg-slate-900/50 backdrop-blur flex flex-col">
            <h3 class="text-2xl font-bold mb-2">Starter</h3>
            <p class="text-slate-400 mb-6">Perfeito para times pequenos começando a escalar.</p>
            <div class="mb-8">
              <span class="text-5xl font-extrabold">R$ 97</span>
              <span class="text-slate-500">/mês</span>
            </div>
            <ul class="space-y-4 mb-8 flex-1">
              <li class="flex items-center gap-3 text-slate-300">
                <UIcon name="i-heroicons-check" class="w-5 h-5 text-primary-500 shrink-0" />
                <span>Até 3 agentes conectados</span>
              </li>
              <li class="flex items-center gap-3 text-slate-300">
                <UIcon name="i-heroicons-check" class="w-5 h-5 text-primary-500 shrink-0" />
                <span>1 Número de WhatsApp</span>
              </li>
              <li class="flex items-center gap-3 text-slate-300">
                <UIcon name="i-heroicons-check" class="w-5 h-5 text-primary-500 shrink-0" />
                <span>CRM Kanban Básico</span>
              </li>
            </ul>
            <UButton size="lg" color="gray" variant="solid" class="w-full justify-center bg-white/5 hover:bg-white/10 border border-white/10" to="http://localhost:3000/register">
              Começar com Starter
            </UButton>
          </div>

          <!-- Pro Plan -->
          <div class="rounded-3xl p-8 border-2 border-primary-500 bg-slate-900 shadow-[0_0_40px_-10px_rgba(var(--color-primary-500),0.3)] flex flex-col relative transform md:-translate-y-4">
            <div class="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
              Mais Popular
            </div>
            <h3 class="text-2xl font-bold mb-2">Pro</h3>
            <p class="text-slate-400 mb-6">Para agências que operam em alto volume.</p>
            <div class="mb-8">
              <span class="text-5xl font-extrabold">R$ 297</span>
              <span class="text-slate-500">/mês</span>
            </div>
            <ul class="space-y-4 mb-8 flex-1">
              <li class="flex items-center gap-3 text-white font-medium">
                <UIcon name="i-heroicons-check" class="w-5 h-5 text-primary-500 shrink-0" />
                <span>Agentes Ilimitados</span>
              </li>
              <li class="flex items-center gap-3 text-slate-300">
                <UIcon name="i-heroicons-check" class="w-5 h-5 text-primary-500 shrink-0" />
                <span>Até 5 Números de WhatsApp</span>
              </li>
              <li class="flex items-center gap-3 text-slate-300">
                <UIcon name="i-heroicons-check" class="w-5 h-5 text-primary-500 shrink-0" />
                <span>Dashboards Analíticos Avançados</span>
              </li>
              <li class="flex items-center gap-3 text-slate-300">
                <UIcon name="i-heroicons-check" class="w-5 h-5 text-primary-500 shrink-0" />
                <span>Smart Routing Automático</span>
              </li>
            </ul>
            <UButton size="lg" color="primary" class="w-full justify-center shadow-lg shadow-primary-500/20" to="http://localhost:3000/register">
              Escalar com Pro
            </UButton>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="py-12 border-t border-white/10 bg-slate-950 mt-12">
      <div class="container mx-auto px-4 text-center text-slate-500">
        <div class="flex items-center justify-center gap-2 mb-4">
          <UIcon name="i-heroicons-chat-bubble-bottom-center-text" class="w-6 h-6" />
          <span class="font-bold text-lg text-white">Flux CRM</span>
        </div>
        <p>© 2026 Flux Inc. Todos os direitos reservados.</p>
        <p class="mt-2 text-sm text-slate-600">Construído em um Monorepo impressionante.</p>
      </div>
    </footer>
  </div>
</template>
