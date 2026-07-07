# EPIC-1: Fundação & Módulo de Autenticação

**Status:** Em Andamento
**Owner:** @architect + @dev
**Criado:** 2026-06-03
**Atualizado:** 2026-07-07 (Decisão Arquitetural: JWT Custom)
**PRD:** [whatsapp-saas-prd.md](../prd/whatsapp-saas-prd.md)

---

## Objetivo

Implementar o sistema completo de autenticação e gestão de usuários (Login, Registro, Recuperação de Senha, Logout), além de proteger as rotas da aplicação através de middlewares (guest e auth). Este módulo é pré-requisito para o acesso aos Workspaces.

**Este epic é bloqueante para os épicos de negócios subsequentes (Epic 2 ao 7).**

---

## Escopo

### In Scope

- **Sistema de autenticação custom** com JWT + bcrypt (decisão arquitetural de 2026-07-07)
- Telas públicas `/login`, `/esqueci-senha`, `/redefinir-senha`
- Componentização de formulários (BaseInput, BaseButton, LoginForm, RegisterForm)
- Middlewares de rota (`auth` para proteger rotas privadas, `guest` para impedir logados na tela de login)
- Composables reutilizáveis (`useAuth()`)
- **Criação atômica de tenant + agent admin** via transação PostgreSQL
- Gerenciamento de token via cookie (7 dias de validade)
- Carregamento de dados do usuário ativo no Pinia
- **Rate limiting** nos endpoints de autenticação
- **Validação robusta de senha** (8+ caracteres, maiúsculas, minúsculas, números, especiais)

### Out of Scope

- Gestão de convites para o Workspace (isso será no Epic 2 - Módulo de Workspaces).
- UI/UX complexa ou integrações com redes sociais (apenas E-mail e Senha inicial).
- Cobrança/Pagamento no momento do registro (Epic 6).

---

## Stories

| ID                             | Título                                                | Pontos | Prioridade | Status |
| ------------------------------ | ----------------------------------------------------- | ------ | ---------- | ------ |
| [1.1](../stories/1.1.story.md) | JWT Custom Auth & Composables                         | 5      | Crítico    | Done   |
| [1.2](../stories/1.2.story.md) | Login & Register UI (Páginas Públicas)                | 5      | Crítico    | Done   |
| [1.3](../stories/1.3.story.md) | Recuperação de Senha & Redefinição                    | 3      | Alto       | To Do  |
| [1.4](../stories/1.4.story.md) | Multi-tenant Registration & Pinia State               | 5      | Crítico    | Done   |
| [1.5](../stories/1.5.story.md) | Route Middlewares (Auth & Guest)                      | 3      | Crítico    | Done   |
| [1.6](../stories/1.6.story.md) | Security Hardening (Rate Limit + Password Validation) | 8      | Crítico    | To Do  |

**Total de Pontos:** 29
**Pontos Completos:** 18 (62%)
**Pontos Pendentes:** 11 (38%)

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

- [x] Usuário consegue criar uma conta com e-mail e senha
- [x] Após registro, tenant e agent admin são criados atomicamente via transação PostgreSQL
- [x] Usuário consegue fazer login com sucesso
- [x] Token JWT é armazenado em cookie httpOnly com 7 dias de validade
- [x] Usuário logado que acessa `/login` é redirecionado (middleware `guest`)
- [x] Usuário não logado que tenta acessar rotas privadas é redirecionado para `/login` (middleware `auth`)
- [ ] **PENDENTE:** Rate limiting implementado nos endpoints de autenticação
- [ ] **PENDENTE:** Validação robusta de senha (8+ chars, maiúsc, minúsc, números, especiais)
- [ ] **PENDENTE:** Usuário consegue pedir link de recuperação e alterar a senha
- [x] Nome/Email do usuário está carregado na store do Pinia

---

## Requisitos Técnicos

| Requisito                                          | Status          | Severidade  |
| -------------------------------------------------- | --------------- | ----------- |
| Sistema de autenticação JWT custom com PostgreSQL  | ✅ Implementado | OBRIGATÓRIO |
| Composable `useAuth()` e componentes reutilizáveis | ✅ Implementado | OBRIGATÓRIO |
| State management via Pinia                         | ✅ Implementado | OBRIGATÓRIO |
| Multi-tenancy (tenant_id em todas as queries)      | ✅ Implementado | OBRIGATÓRIO |
| Rate limiting em endpoints de auth                 | ❌ Pendente     | CRÍTICO     |
| Validação robusta de senha                         | ❌ Pendente     | CRÍTICO     |
| Recuperação de senha via email                     | ❌ Pendente     | ALTO        |
| CSRF protection                                    | ❌ Pendente     | ALTO        |

---

## Riscos

| Risco                                     | Impacto | Mitigação                                             | Status      |
| ----------------------------------------- | ------- | ----------------------------------------------------- | ----------- |
| Ataques de força bruta sem rate limiting  | ALTO    | Implementar @fastify/rate-limit                       | ⚠️ PENDENTE |
| Senhas fracas permitidas (apenas 6 chars) | ALTO    | Validação robusta (8+, maiúsc, minúsc, num, especial) | ⚠️ PENDENTE |
| JWT_SECRET com fallback inseguro          | CRÍTICO | Lançar erro se variável não definida                  | ⚠️ PENDENTE |
| Falta de CSRF protection                  | MÉDIO   | Implementar @fastify/csrf-protection                  | ⚠️ PENDENTE |
| Token não validado no middleware frontend | MÉDIO   | Validar expiração do JWT no client                    | ⚠️ PENDENTE |
| Responsabilidade total por segurança auth | ALTO    | Seguir OWASP guidelines, auditorias regulares         | 🔄 CONTÍNUO |

---

## Dependências

**Depende de:** EPIC-0 (Projeto iniciado e Supabase configurado)
**Bloqueia:** EPIC-2 (Módulo de Workspaces)

---

## Progresso

```
[######----] 62% (18/29 pontos)
```

### Implementado ✅

- Sistema de autenticação JWT custom
- Login e registro com criação multi-tenant
- Middlewares de proteção de rotas
- Composable useAuth()
- Integração com Pinia stores
- UI com componentes reutilizáveis

### Pendente ⚠️

- Rate limiting (Story 1.6)
- Validação robusta de senha (Story 1.6)
- Recuperação de senha (Story 1.3)
- Proteção CSRF
- Validação de token no middleware frontend

### Documentação 📝

- ✅ [Relatório de Revisão Completo](../analise/revisao-sistema-autenticacao-2026-07-07.md)
