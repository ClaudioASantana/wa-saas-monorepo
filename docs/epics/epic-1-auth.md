# EPIC-1: Fundação & Módulo de Autenticação

**Status:** Planejamento
**Owner:** @architect + @dev
**Criado:** 2026-06-03
**PRD:** [whatsapp-saas-prd.md](../prd/whatsapp-saas-prd.md)

---

## Objetivo

Implementar o sistema completo de autenticação e gestão de usuários (Login, Registro, Recuperação de Senha, Logout), além de proteger as rotas da aplicação através de middlewares (guest e auth). Este módulo é pré-requisito para o acesso aos Workspaces.

**Este epic é bloqueante para os épicos de negócios subsequentes (Epic 2 ao 7).**

---

## Escopo

### In Scope

- Integração nativa com `@nuxtjs/supabase` para Auth.
- Telas públicas `/login`, `/esqueci-senha`, `/redefinir-senha`.
- Componentização de formulários (BaseInput, BaseButton).
- Middlewares de rota (`auth` para proteger rotas privadas, `guest` para impedir logados na tela de login).
- Composables reutilizáveis (ex: `useAuth()`).
- Trigger no Supabase para sincronizar `auth.users` com a tabela `profiles`.
- Carregamento de dados do usuário ativo no Pinia (via Plugin do Nuxt no startup).

### Out of Scope

- Gestão de convites para o Workspace (isso será no Epic 2 - Módulo de Workspaces).
- UI/UX complexa ou integrações com redes sociais (apenas E-mail e Senha inicial).
- Cobrança/Pagamento no momento do registro (Epic 6).

---

## Stories

| ID | Título | Pontos | Prioridade | Status |
|----|--------|--------|------------|--------|
| [1.1](../stories/1.1.story.md) | Supabase Auth Integration & Composables | 5 | Crítico | Draft |
| [1.2](../stories/1.2.story.md) | Login & Register UI (Páginas Públicas) | 5 | Crítico | Draft |
| [1.3](../stories/1.3.story.md) | Recuperação de Senha & Redefinição | 3 | Alto | Draft |
| [1.4](../stories/1.4.story.md) | Profile Trigger & Pinia State (Nuxt Plugin) | 5 | Crítico | Draft |
| [1.5](../stories/1.5.story.md) | Route Middlewares (Auth & Guest) | 3 | Crítico | Draft |

**Total de Pontos:** 21

---

## Sequência de Implementação

```
1.1 Supabase Auth & Composables
  └── 1.2 Login/Register UI
        └── 1.4 Profile Trigger & Pinia
              └── 1.5 Route Middlewares
  └── 1.3 Recuperação de Senha
```

---

## Critérios de Sucesso

- [ ] Usuário consegue criar uma conta com e-mail e senha.
- [ ] Após registro, a tabela `profiles` é populada automaticamente via Trigger no Postgres.
- [ ] Usuário consegue fazer login com sucesso.
- [ ] Usuário logado que acessa `/login` é redirecionado (middleware `guest`).
- [ ] Usuário não logado que tenta acessar `/` ou `/perfil` é redirecionado para `/login` (middleware `auth`).
- [ ] Usuário consegue pedir link de recuperação e alterar a senha.
- [ ] Nome/Email do usuário está carregado na store do Pinia após recarregar a página.

---

## Requisitos Técnicos (do PRD)

| Requisito | Seção PRD | Severidade |
|-----------|-----------|------------|
| Uso do Supabase Auth e PostgreSQL | 2 / 6 | OBRIGATÓRIO |
| Composable `useAuth()` e componentes reutilizáveis | 3 | OBRIGATÓRIO |
| Performance via Cache (Plugin + Pinia) | 3 | OBRIGATÓRIO |
| Trigger para popular `profiles` | 6 | OBRIGATÓRIO |

---

## Riscos

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Atraso/Latência na trigger de `profiles` afetando o login imediato | Médio | Criar a trigger com `security definer` e otimizar. Tratar loading state no frontend. |
| Inconsistência de sessão no SSR do Nuxt 3 com Supabase | Alto | Usar o módulo oficial `@nuxtjs/supabase` que já gerencia cookies de forma consistente entre SSR e Client. |

---

## Dependências

**Depende de:** EPIC-0 (Projeto iniciado e Supabase configurado)
**Bloqueia:** EPIC-2 (Módulo de Workspaces)

---

## Progresso

```
[----------] 0%
```
