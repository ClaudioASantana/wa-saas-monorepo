# 📄 Documento de Requisitos do Produto (PRD) - SaaS Multiatendimento & CRM

**Produto:** SaaS de Multiatendimento WhatsApp (Team Inbox & CRM)
**Versão:** 2.0
**Data:** 2026-03-07
**Status:** Atualizado (Merge Z-API & Nuxt Stack)

---

## 1. Visão Geral do Projeto

Desenvolvimento de um **SaaS de Multiatendimento e CRM corporativo**, que transforma o WhatsApp em uma plataforma centralizada, colaborativa e escalável para equipes de vendas e suporte. O sistema centraliza a comunicação via WhatsApp, permite a atribuição de conversas para múltiplos agentes utilizando um único número, e possui um CRM Kanban interativo integrado. O SaaS é **multi-tenant**, operando com áreas de trabalho isoladas (Workspaces) voltadas para donos de agências e empresas.

---

## 2. Stack Tecnológica Obrigatória

A infraestrutura e o desenvolvimento devem estritamente utilizar as seguintes tecnologias:

- **Framework Fullstack:** Nuxt.js (Vue 3, Composition API).
- **Estilização:** Tailwind CSS (sem uso da tag `<style>`, usar apenas classes utilitárias).
- **Banco de Dados & Autenticação:** Supabase (Integração via módulo nativo `@nuxtjs/supabase` com PostgreSQL).
- **Gerenciamento de Estado Global:** Pinia (Store/Cache).
- **Mensageria Real-Time:** Pusher (WebSockets) e servidor Node.js auxiliar.
- **Storage (Imagens/Mídias):** Cloudflare R2 (com upload assíncrono).
- **Pagamentos:** Stripe.
- **Integração WhatsApp:** Z-API (modularizada via um "normalizador" para fácil troca futura por outras APIs).
- **Cache & Filas (Auxiliar):** Redis (para controle de estado, filas de mensagens, e idempotência no recebimento de webhooks).

---

## 3. Diretrizes de Desenvolvimento (Regras para a Inteligência Artificial)

- **Componentização Extrema:** NUNCA gere páginas inteiras de uma vez. Construa a interface como "blocos de montar", criando componentes pequenos e reutilizáveis (ex: `BaseInput`, `BaseButton`, `BaseDropdown`) para evitar alucinações e perda de contexto.
- **Estrutura de Pastas de Componentes:** Componentes específicos de uma página devem ficar em uma subpasta com o mesmo nome da página (ex: `pages/login.vue` -> componentes em `components/login/`).
- **Backend Blindado (`server/api`):** Toda comunicação com o banco de dados que expõe regras de negócio deve ocorrer no backend integrado do Nuxt (`server/api`). Utilize a `Service Key` do Supabase exclusivamente nestas rotas para ignorar o RLS de forma segura para operações críticas ou sistêmicas, enquanto usa segurança baseada em token nas chamadas feitas pelo cliente.
- **Performance via Cache:** Utilize **Plugins** do Nuxt para buscar os dados do usuário logado assim que o app carregar, salvando essas informações na **Store do Pinia** para evitar consultas repetidas ao banco de dados.

---

## 4. Arquitetura e Infraestrutura de Backend

### 4.1. Isolamento Multi-Tenant

- **Modelo:** Shared Schema (Tabelas Compartilhadas).
- Coluna `tenant_id` em todas as tabelas e o escopo de leitura e gravação deve sempre ser filtrado por este ID para garantir que dados de "Workspace A" não vazem para "Workspace B".

### 4.2. Idempotência e Tratamento de Webhooks (Z-API)

- Como provedores de API como a Z-API podem enviar webhooks duplicados (at-least-once), é **OBRIGATÓRIO** processar webhooks (mensagens recebidas e status) garantindo idempotência.
- Recomenda-se utilizar Redis (`SET NX`) e hash da assinatura/id da mensagem para descartar mensagens duplicadas antes delas entrarem no funil de processamento.

### 4.3. Comunicação em Tempo Real

- Utilize o **Pusher** para enviar atualizações bidirecionais entre o Node.js auxiliar e o Nuxt.js.
- **PROIBIDO:** Long Polling (HTTP). Mensagens e atualizações de status devem refletir na tela do agente em tempo real.

### 4.4. Armazenamento de Mídia Assíncrono

- Mídias não devem ser salvas ou processadas sincronamente na thread principal para não bloquear o Event Loop.
- Upload de mídias ocorrerá via background (background threads no Node.js auxiliar), enviando diretamente para o **Cloudflare R2**.

### 4.5. Deploy e Hospedagem de Banco de Dados

- O sistema utiliza **Supabase** nativamente (através do `@nuxtjs/supabase`).
- Em produção, a arquitetura adotada é **Supabase via Docker (Self-Hosted)** rodando no próprio servidor (VPS ou Dedicado) em vez da versão gerenciada (Cloud). 
- Isso garante controle total dos dados (privacidade) e reduz os custos de escala a zero para um número crescente de empresas (multi-tenant) e usuários. A API, o GoTrue (Auth), o Realtime e o PostgREST operam de forma nativa e transparente no servidor do cliente.

---

## 5. Arquitetura de Rotas e Permissões

A navegação deve ser controlada por **Middlewares** do Nuxt e as rotas divididas da seguinte forma:

### 5.1. Rotas Públicas (Sem necessidade de login)

- `/login`: Formulários de Login e Criação de Conta (abas).
- `/esqueci-senha`: Solicitação de link de recuperação.
- `/redefinir-senha`: Definição de nova senha.

### 5.2. Rotas Privadas Globais (Protegidas)

- `/`: Página inicial, lista os Workspaces disponíveis para o usuário.
- `/perfil`: Exibe dados do usuário (Nome, Telefone, Email readonly) e formulário para alteração de senha.
- `/assinatura`: Gerenciamento do plano atual via Stripe.

### 5.3. Rotas Privadas Dinâmicas (Workspaces Multi-tenant)

Estrutura baseada na rota `/workspace/[id]/...`. Cada módulo carrega dados exclusivos do ID informado na URL:

- `/workspace/[id]/chat`: Interface semelhante ao WhatsApp Web, lista de conversas, atribuição e painel de chat central.
- `/workspace/[id]/dashboard`: Gráficos e métricas gerais de atendimento.
- `/workspace/[id]/canais`: Geração de QR Code e conexão com a API do WhatsApp (Z-API).
- `/workspace/[id]/contatos`: Lista tabular de clientes salvos para exportação/importação.
- `/workspace/[id]/configuracoes`: Gerenciamento do Workspace atual (nome, exclusão, edição).

---

## 6. Estrutura de Banco de Dados Mínima (Supabase)

- **Auth (Nativo):** Gerencia e-mail, senhas e sessões seguras.
- **Profiles (`profiles`):** Tabela alimentada por uma _Trigger_ do Postgres logo após o `signup` na tabela `auth.users`. Armazena ID, Nome, E-mail, Telefone e data de criação. Estes dados são chamados e armazenados no cache (`Pinia`) pelo plugin de inicialização.
- **Workspaces (`workspaces`):** Representa cada tenant (empresa/agência).
- **Users Workspaces (`user_workspaces`):** Tabela pivô relacionando quais perfis de usuário pertencem a quais Workspaces, junto da sua role (Owner, Admin, Agente).

---

## 7. Épicos e Funcionalidades Principais

### Epic 1: Fundação & Módulo de Autenticação (PRÉ-REQUISITO)

- Login, Registro, Recuperação de Senha e Logout utilizando composables (ex: `useAuth()`).
- Redirecionamentos via middleware (ex: middleware `guest` previne usuário logado de ver a tela de login; middleware `auth` protege as áreas internas).

### Epic 2: Módulo de Workspaces

- Sistema de isolamento de clientes (Tenants).
- A side-bar de navegação (`layouts/default.vue` ou layout de workspace ativo) é ativada apenas dentro destas áreas (`/workspace/[id]/...`).

### Epic 3: Módulo de Multiatendimento (Caixa de Entrada Omnicanal)

- Chat em tempo real recebendo "Webhooks" via Pusher originados da integração com Z-API ou Node.js auxiliar.
- Transferência de conversas entre atendentes, departamentos (triagem via chatbot) ou finalização de atendimento (Handoff / Take Over).
- Apoio a multimídia (áudio, imagem, documentos) via integração com o R2.
- Filtros como "Minhas Conversas" por agente logado ("Em atendimento"), "Aguardando", "Finalizadas/Histórico".

### Epic 4: Módulo CRM Kanban

- Funil de vendas interativo para gestão visual de leads baseados em chats do WhatsApp.
- Suporte para múltiplos funis simultâneos criados pelo usuário (ex: Funil de Vendas, Funil de Suporte, Onboarding).
- Integração direta de colunas Customizadas para arrastar conversas e contatos. Atualização do funil em tempo real caso uma mensagem nova chegue.

### Epic 5: Roteamento Inteligente (Smart Routing)

- Regras lógicas de distribuição baseadas em Tags, Departamentos ou Round-Robin (distribuição automática igualitária) de novas conversas recebidas.
- Identificação de cliente existente: Se há CRM ou ticket aberto, a conversa retorna ao último agente.

### Epic 6: Sistema de Faturamento SaaS (Billing)

- Integração com o painel de faturamento do **Stripe**.
- Gestão de assinaturas / mensalidades baseadas no número de assentos (agentes extras) ou planos modulares.
- Bloqueio automático de funcionalidades por inadimplência rastreada via webhooks do Stripe.

### Epic 7: Dashboards Analíticos

- Métricas e KPIs, como Tempo Médio de Resposta (TMR), Tempo Médio de Resolução, volume de mensagens.
- Taxa de conversões das etapas do Kanban: Leads recebidos vs Finalizados/Ganhos.

---
