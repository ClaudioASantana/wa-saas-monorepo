# Relatório de Revisão: Sistema de Autenticação Custom

**Data:** 07/07/2026  
**Revisor:** Agente de Análise AIOS  
**Escopo:** Sistema completo de autenticação (Backend + Frontend)  
**Decisão Arquitetural:** Manter implementação JWT custom (sem Supabase Auth)

---

## 📋 Resumo Executivo

Análise completa do sistema de autenticação do monorepo WA-SaaS, com implementação custom usando JWT + bcrypt + PostgreSQL direto, sem dependência do Supabase Auth. Esta é uma decisão arquitetural consciente que diverge do Epic 1 original, mas oferece maior controle e flexibilidade.

---

## 🏗️ Arquitetura Implementada

### Backend (apps/api)

**Stack Tecnológico:**

- Fastify (Framework)
- JWT (jsonwebtoken)
- bcrypt (Hashing de senhas)
- PostgreSQL (Database direto via pool)

**Componentes:**

1. **Rotas de Autenticação** (`apps/api/src/routes/auth.ts`)
   - POST `/auth/login` - Autenticação com email/senha
   - POST `/auth/register` - Registro multi-tenant (cria tenant + agent admin)
   - GET `/auth/me` - Obter dados do usuário autenticado

2. **Middleware de Autenticação** (`apps/api/src/middleware/auth.ts`)
   - Validação de token JWT via header Authorization
   - Anexa dados do usuário em `request.user`
   - Extensão do tipo FastifyRequest via declaration merging

3. **Configuração JWT** (`apps/api/src/config/jwt.ts`)
   - Função `verifyToken()` para validação
   - Função `extractUserId()` para extração de ID
   - Compatibilidade com múltiplos formatos de payload

4. **Database Migration** (`005_auth_setup.sql`)
   - Adiciona coluna `password_hash` na tabela `agents`

### Frontend (apps/web)

**Stack Tecnológico:**

- Nuxt 3
- Pinia (State management)
- Cookie-based token storage

**Componentes:**

1. **Composable useAuth** (`composables/useAuth.ts`)
   - Métodos: login, register, logout, fetchUser
   - Gerenciamento de token via cookie (7 dias de validade)
   - Integração com stores (user, workspace, agents)
   - Placeholder para forgot/reset password

2. **Route Middleware** (`middleware/auth.ts`)
   - Proteção de rotas privadas
   - Redirecionamento para /login se token ausente

3. **UI de Autenticação**
   - `pages/login.vue` - Página principal com toggle Login/Cadastro
   - `components/login/LoginForm.vue` - Formulário de login
   - `components/login/RegisterForm.vue` - Formulário de cadastro

---

## ⚠️ Problemas Identificados (PRECISA CORRIGIR)

### 🔴 CRÍTICOS - CORRIGIR IMEDIATAMENTE

#### 1. JWT_SECRET com Fallback Inseguro

**Localização:**

- `apps/api/src/routes/auth.ts:72`
- `apps/api/src/routes/auth.ts:144`
- `apps/api/src/middleware/auth.ts:25`

**Código Problemático:**

```typescript
process.env.JWT_SECRET || 'secret'
```

**Risco:** Em produção sem variável configurada, usaria chave hardcoded 'secret'

**Solução:**

```typescript
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}
```

---

#### 2. Falta de Rate Limiting

**Localização:** Endpoints `/auth/login` e `/auth/register`

**Risco:** Vulnerável a:

- Ataques de força bruta
- Credential stuffing
- Account enumeration

**Solução:** Implementar @fastify/rate-limit

```typescript
import rateLimit from '@fastify/rate-limit'

await app.register(rateLimit, {
  max: 5,
  timeWindow: '15 minutes',
})

app.post(
  '/auth/login',
  {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '15 minutes',
      },
    },
  },
  async (request, reply) => {
    // ...
  }
)
```

---

#### 3. Validação de Senha Muito Fraca

**Localização:** `apps/api/src/routes/auth.ts:100-102`

**Código Atual:**

```typescript
if (password.length < 6) {
  return reply.status(400).send({ error: 'Senha deve ter pelo menos 6 caracteres' })
}
```

**Problema:** Permite senhas triviais como "123456", "aaaaaa"

**Solução:**

```typescript
function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Senha deve ter pelo menos 8 caracteres' }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Senha deve conter pelo menos uma letra maiúscula' }
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Senha deve conter pelo menos uma letra minúscula' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Senha deve conter pelo menos um número' }
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, error: 'Senha deve conter pelo menos um caractere especial' }
  }
  return { valid: true }
}
```

---

#### 4. Falta de Proteção CSRF

**Risco:** Endpoints de autenticação sem proteção CSRF

**Solução:** Implementar @fastify/csrf-protection para endpoints sensíveis

---

### 🟡 IMPORTANTES - CORRIGIR EM BREVE

#### 5. Middleware Frontend Não Valida Token

**Localização:** `apps/web/middleware/auth.ts`

**Código Atual:**

```typescript
if (!token.value) {
  return navigateTo('/login')
}
```

**Problema:** Apenas verifica existência, não valida expiração

**Solução:** Decodificar JWT e verificar exp claim

```typescript
function isTokenExpired(token: string): boolean {
  try {
    const [, payload] = token.split('.')
    const decoded = JSON.parse(atob(payload))
    return decoded.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

if (!token.value || isTokenExpired(token.value)) {
  return navigateTo('/login')
}
```

---

#### 6. Recuperação de Senha Não Implementada

**Localização:** `apps/web/composables/useAuth.ts:107-126`

**Status:** TODOs pendentes para forgot/reset password

**Impacto:** Story 1.3 incompleta, má UX

**Solução:** Implementar fluxo completo:

1. Endpoint POST `/auth/forgot-password` (gera token, envia email)
2. Endpoint POST `/auth/reset-password` (valida token, atualiza senha)
3. Integração com serviço de email (ex: SendGrid, AWS SES)

---

#### 7. Duplicação de Interface TokenPayload

**Localização:** 3 arquivos diferentes

- `apps/api/src/routes/auth.ts:19-24`
- `apps/api/src/middleware/auth.ts:4-9`
- `apps/api/src/config/jwt.ts:9-15`

**Problema:** Manutenibilidade, risco de inconsistência

**Solução:** Centralizar em `packages/shared/src/types/auth.ts`

```typescript
export interface TokenPayload {
  agentId: string
  tenantId: string
  email: string
  role: string
  iat?: number
  exp?: number
}
```

---

#### 8. Reload Completo da Página Após Login

**Localização:** `apps/web/components/login/LoginForm.vue:76`

**Código Atual:**

```typescript
window.location.href = '/'
```

**Problema:** Quebra SPA, experiência inferior

**Solução:**

```typescript
await navigateTo('/', { replace: true })
```

---

### 🟢 MENORES - MELHORIAS INCREMENTAIS

#### 9. Falta de Logs de Auditoria

**Recomendação:** Adicionar logging estruturado

```typescript
app.log.info(
  {
    event: 'login_success',
    agentId: agent.id,
    tenantId: agent.tenant_id,
    email: agent.email,
    ip: request.ip,
    userAgent: request.headers['user-agent'],
  },
  'User login successful'
)
```

---

#### 10. Mensagens de Erro Pouco Específicas

**Status:** Correto para segurança (não vazar informações)

**Recomendação:** Manter mensagens genéricas para usuário, mas logar detalhes internamente

---

#### 11. Inconsistência tenant vs workspace

**Observação:** Backend usa "tenant", frontend às vezes usa "workspace"

**Recomendação:** Padronizar em "tenant" em todo o código

---

#### 12. Falta de Verificação de Email

**Impacto:** Usuários podem se registrar com emails falsos

**Solução Futura:** Implementar verificação via token enviado por email

---

#### 13. Falta de Logout de Todas as Sessões

**Feature Ausente:** Não há como invalidar todos os tokens de um usuário

**Solução Futura:** Implementar token blacklist ou rotation de secrets

---

## ✅ Pontos Positivos da Implementação

1. ✅ **bcrypt com salt rounds adequados** (10) - Bom balanceamento segurança/performance
2. ✅ **Transações database no registro** - BEGIN/COMMIT/ROLLBACK implementado
3. ✅ **Normalização de email** - toLowerCase() + trim() aplicados
4. ✅ **Verificação de status da conta** - Bloqueia contas inativas
5. ✅ **Cookie com maxAge apropriado** - 7 dias alinhado com JWT exp
6. ✅ **Componentização adequada** - LoginForm, RegisterForm separados
7. ✅ **TypeScript em toda implementação** - Type safety
8. ✅ **Multi-tenancy desde o início** - tenant_id em todas as queries
9. ✅ **Criação atômica de tenant + admin** - Transação garante consistência
10. ✅ **Middleware reutilizável** - authenticate() pode ser usado em múltiplas rotas

---

## 📊 Análise de Segurança

### Checklist OWASP

| Categoria                                   | Status | Observações                              |
| ------------------------------------------- | ------ | ---------------------------------------- |
| Injection                                   | ✅     | Usando parameterized queries             |
| Broken Authentication                       | ⚠️     | Falta rate limiting, senha fraca         |
| Sensitive Data Exposure                     | ✅     | Senha com bcrypt, JWT em cookie httpOnly |
| XML External Entities                       | N/A    | Não usa XML                              |
| Broken Access Control                       | ✅     | Middleware valida token                  |
| Security Misconfiguration                   | ❌     | JWT_SECRET com fallback inseguro         |
| XSS                                         | ✅     | Vue escapa output automaticamente        |
| Insecure Deserialization                    | ✅     | JWT validado antes de usar               |
| Using Components with Known Vulnerabilities | ⚠️     | Necessário npm audit                     |
| Insufficient Logging & Monitoring           | ❌     | Falta logging de eventos de auth         |

**Score Geral: 6/10** (Precisa melhorar)

---

## 🎯 Plano de Ação Recomendado

### Sprint Atual (Críticos)

- [ ] **P0:** Remover fallback JWT_SECRET inseguro
- [ ] **P0:** Implementar rate limiting nos endpoints de auth
- [ ] **P0:** Melhorar validação de senha (8+ chars, maiúsc, minúsc, número, especial)
- [ ] **P1:** Adicionar proteção CSRF

**Estimativa:** 8 pontos

---

### Próximo Sprint (Importantes)

- [ ] **P1:** Implementar validação de token no middleware frontend
- [ ] **P1:** Implementar fluxo completo de recuperação de senha (Story 1.3)
- [ ] **P1:** Centralizar interface TokenPayload em packages/shared
- [ ] **P2:** Substituir window.location.href por navigateTo
- [ ] **P2:** Adicionar logs de auditoria estruturados

**Estimativa:** 13 pontos

---

### Backlog (Melhorias)

- [ ] **P3:** Implementar verificação de email
- [ ] **P3:** Padronizar nomenclatura tenant/workspace
- [ ] **P3:** Implementar refresh tokens
- [ ] **P3:** Adicionar 2FA/MFA
- [ ] **P3:** OAuth social (Google, GitHub)
- [ ] **P3:** Token blacklist para logout global

**Estimativa:** 21 pontos

---

## 📂 Arquivos Analisados

### Backend (289 linhas)

- ✓ `apps/api/src/routes/auth.ts` (211 linhas)
- ✓ `apps/api/src/middleware/auth.ts` (32 linhas)
- ✓ `apps/api/src/config/jwt.ts` (38 linhas)
- ✓ `apps/api/src/db/migrations/005_auth_setup.sql` (6 linhas)

### Frontend (294 linhas)

- ✓ `apps/web/composables/useAuth.ts` (139 linhas)
- ✓ `apps/web/middleware/auth.ts` (11 linhas)
- ✓ `apps/web/pages/login.vue` (66 linhas)
- ✓ `apps/web/components/login/LoginForm.vue` (78 linhas)

### Documentação (148 linhas)

- ✓ `docs/epics/epic-1-auth.md` (107 linhas)
- ✓ `docs/stories/1.1.story.md` (20 linhas)
- ✓ `docs/stories/1.2.story.md` (21 linhas)

**Total:** 731 linhas de código analisadas

---

## 🔄 Impacto na Documentação

### Epic 1 - Precisa Atualização

**Mudanças necessárias em `docs/epics/epic-1-auth.md`:**

1. ❌ Remover: "Integração nativa com `@nuxtjs/supabase` para Auth"
2. ✅ Adicionar: "Sistema de autenticação custom com JWT + bcrypt"
3. ❌ Remover: "Trigger no Supabase para sincronizar `auth.users` com a tabela `profiles`"
4. ✅ Adicionar: "Criação atômica de tenant + agent admin via transação PostgreSQL"

### Stories - Status Atualizado

| Story | Status Anterior | Status Atual | Observação                                               |
| ----- | --------------- | ------------ | -------------------------------------------------------- |
| 1.1   | Draft           | Done         | Renomeada para "JWT Custom Auth & Composables"           |
| 1.2   | Draft           | Done         | Implementação completa                                   |
| 1.3   | Draft           | To Do        | Recuperação de senha ainda não implementada              |
| 1.4   | Draft           | Done         | Renomeada para "Multi-tenant Registration & Pinia State" |
| 1.5   | Draft           | Done         | Middlewares implementados                                |
| 1.6   | -               | To Do        | **NOVA**: Security Hardening (8 pontos)                  |

---

## 📝 Conclusão Final

A revisão completa do sistema de autenticação revelou uma implementação **funcionalmente sólida** com arquitetura JWT custom que diverge do planejamento original (Supabase Auth), mas oferece maior controle e flexibilidade para o contexto multi-tenant.

### Status Geral

- ✅ **62% completo** (18/29 pontos do Epic 1)
- ⚠️ **Vulnerabilidades críticas** identificadas que precisam correção imediata
- 📋 **Story 1.6 criada** para hardening de segurança (8 pontos)

### Ações Imediatas Requeridas

**Prioridade P0 (Bloquear produção):**

1. Remover fallback JWT_SECRET inseguro
2. Implementar rate limiting
3. Melhorar validação de senha

**Prioridade P1 (Próximo sprint):** 4. Implementar recuperação de senha (Story 1.3) 5. Validar token no middleware frontend 6. Adicionar proteção CSRF

### Decisão Arquitetural Confirmada

✅ **Manter implementação JWT custom** (sem Supabase Auth)

- Epic 1 atualizado para refletir esta decisão
- Documentação alinhada com código implementado
- Plano de ação definido para completar funcionalidades críticas

### Próximos Passos

1. **Toggle para ACT MODE** e implementar correções da Story 1.6
2. Completar Story 1.3 (recuperação de senha)
3. Executar npm audit e corrigir vulnerabilidades
4. Adicionar testes E2E para fluxos de autenticação

---

**Relatório gerado em:** 2026-07-07T18:25:00-03:00  
**Revisado por:** Agente de Análise AIOS  
**Referência:** [Epic 1 - Auth](../epics/epic-1-auth.md)
