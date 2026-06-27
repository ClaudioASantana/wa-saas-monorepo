# Relatório técnico do monorepo

Data: 2026-06-27

## 1. Arquitetura atual

O repositório é um monorepo npm workspaces com `apps/*` e `packages/*` em `package.json:5`. O fluxo local é centralizado por scripts da raiz, com build e dev executados por workspace.

### Componentes principais
- `apps/api`: backend Fastify em TypeScript
- `apps/web`: frontend Nuxt 3 da aplicação principal
- `apps/marketing`: frontend Nuxt 3 separado para site institucional
- `apps/e2e`: testes ponta a ponta
- `packages/shared`: pacote compartilhado
- `supabase/`: migrações e estrutura de banco
- `apps/whatsapp-engine`: serviço adicional de integração/processamento

## 2. Acoplamentos e dependências

### Shared package
O backend depende explicitamente de `@wa-saas/shared` em `apps/api/package.json:19`. Isso indica que o pacote compartilhado é parte do contrato entre camadas e precisa manter compatibilidade com API e front.

### Configuração entre front e back
O front principal usa `runtimeConfig` para receber URLs e segredos em `apps/web/nuxt.config.ts:22-35`, incluindo:
- `apiUrl`
- `appUrl`
- `supabaseUrl`
- `supabaseServiceKey`
- chaves Stripe
- URL do WhatsApp engine

Isso mostra que o front é dependente de múltiplos serviços e que a configuração de ambiente é um ponto crítico.

### Infra de execução
O backend usa Fastify, Postgres, Redis, BullMQ, Socket.IO, JWT e S3. O front usa Nuxt, Pinia, Supabase, Socket.IO client, Stripe, Zod e Tailwind. A stack é relativamente pesada e sugere vários pontos de integração assíncrona e em tempo real.

## 3. Pipeline de build e execução

A raiz define um fluxo consistente:
- `npm run dev` sobe API, web e marketing em paralelo
- `npm run build` compila `packages/shared` antes das apps
- `npm run typecheck` valida shared, API e web em sequência

Ponto de atenção: o marketing site não aparece no `typecheck` raiz, então pode ter cobertura menor de validação estática do que API e web.

## 4. Riscos técnicos observáveis

### 4.1 Configuração espalhada por ambiente
O `runtimeConfig` do front carrega várias chaves sensíveis e URLs. Isso aumenta risco de desalinhamento entre ambientes e erros de deploy por variável ausente ou incorreta.

### 4.2 Dependência forte de serviços externos
A presença de Supabase, Stripe, Redis, S3 e WhatsApp engine indica que falhas de integração podem impactar o fluxo principal. O sistema parece depender de múltiplos serviços externos para funcionar plenamente.

### 4.3 Validação incompleta em alguns apps
A raiz faz `typecheck` para shared, api e web, mas não para marketing. Se o marketing for mantido com a mesma cadência das outras apps, isso pode deixar regressões sem cobertura equivalente.

### 4.4 Monorepo com muitos domínios operacionais
Há uma camada de orquestração AIOS/Codex, stories, validações estruturais e agentes. Isso adiciona governança, mas também aumenta a complexidade operacional do repositório.

### 4.5 Banco guiado por migrações incrementais
A pasta `supabase/migrations` mostra evolução contínua do schema. Isso é bom para rastreabilidade, mas exige disciplina forte de compatibilidade e sequenciamento de migrações.

## 5. Observações sobre manutenção

- O projeto já tem uma separação razoável entre domínio principal, marketing e pacote compartilhado.
- O pacote shared é estratégico; mudanças ali têm potencial de impactar várias superfícies.
- O backend parece concentrar lógica de integração e persistência, então tende a ser a área de maior impacto em incidentes.
- A configuração atual favorece desenvolvimento local rápido, mas exige maturidade em gestão de variáveis e serviços externos.

## 6. Recomendações técnicas

1. **Reforçar a validação do marketing app** no pipeline raiz.
2. **Documentar contratos do pacote shared** para evitar quebras silenciosas entre API e front.
3. **Centralizar e versionar a matriz de variáveis de ambiente** por serviço.
4. **Separar claramente o que é core do produto e o que é infraestrutura auxiliar**, especialmente em torno de AIOS e serviços satélites.
5. **Manter disciplina de migração/rollback** no banco, já que o schema evolui por arquivo incremental.

## 7. Conclusão

O monorepo está organizado de forma funcional para um SaaS com múltiplos serviços, mas a complexidade já é alta o suficiente para exigir disciplina de contratos, configuração e validação por app. O principal risco não parece ser a estrutura em si, e sim o acoplamento entre serviços externos, shared package e configurações de ambiente.
