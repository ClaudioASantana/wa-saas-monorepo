# Checklist de Riscos e Ações - Monorepo Wa-SaaS

Data: 2026-06-27

Baseado na análise técnica do monorepo, este checklist prioriza riscos e ações de mitigação.

## Riscos de alto impacto

### R1: Configuração de ambiente espalhada e propensa a erros
- **Descrição**: O `runtimeConfig` do front carrega múltiplas URLs, chaves de API e segredos (Supabase, Stripe, WhatsApp Engine, etc.), aumentando risco de desalinhamento entre ambientes e falhas de deploy por variáveis ausentes ou incorretas.
- **Impacto**: Falhas em tempo de execução, dificuldade de reproduzir bugs localmente, risco de exposição de segredos.
- **Ações**:
  - [ ] Criar script de validação de ambiente antes de `dev`/`build`/`start`
  - [ ] Padronizar `.env.example` na raiz com todas as variáveis usadas pelos apps
  - [ ] Adicionar passo de CI para detectar `.env.example` desatualizado
  - [ ] Lançar erro explícito ao acessar variável obrigatória ausente

### R2: Dependência crítica de serviços externos sem isolamento adequado
- **Descrição**: O sistema depende fortemente de Supabase, Stripe, Redis, S3, WhatsApp Engine e Socket.IO.
- **Impacto**: Indisponibilidade parcial ou total do produto.
- **Ações**:
  - [ ] Implementar circuit breaker para chamadas externas críticas
  - [ ] Criar endpoint `/health` detalhado por dependência
  - [ ] Documentar estratégias de fallback para funções não-core
  - [ ] Adicionar testes de contrato para APIs externas críticas
  - [ ] Monitorar latência e erros das dependências em dashboard

## Riscos de médio impacto

### R3: Cobertura inconsistente de validação estática
- **Descrição**: O `typecheck` raiz inclui `shared`, `api` e `web`, mas não inclui `marketing`.
- **Impacto**: Bugs de tipo no marketing e qualidade desigual entre apps.
- **Ações**:
  - [ ] Incluir `apps/marketing` no `typecheck` raiz
  - [ ] Garantir scripts próprios de `lint` e `typecheck` no marketing
  - [ ] Incluir marketing no pipeline de CI

### R4: Complexidade operacional da camada AIOS/Codex
- **Descrição**: Há governança pesada via AIOS/Codex CLI, stories e validações estruturais.
- **Impacto**: Curva de aprendizado maior e risco de desalinhamento entre processo e prática.
- **Ações**:
  - [ ] Criar documento de fronteiras entre core product e AIOS infra
  - [ ] Revisar scripts obsoletos em `.aios-core/infrastructure/scripts/`
  - [ ] Simplificar onboarding para o fluxo essencial do dia a dia

### R5: Evolução do schema de banco sem garantias de compatibilidade
- **Descrição**: O schema evolui via migrações incrementais em `supabase/migrations`.
- **Impacto**: Risco de breaking changes, dificuldade de rollback e incidentes de deploy.
- **Ações**:
  - [ ] Separar migrações destrutivas de adições seguras por convenção
  - [ ] Detectar migrações destrutivas automaticamente no CI
  - [ ] Criar teste de rollback em staging
  - [ ] Exigir comentário explicando risco de reversão em toda migration

## Oportunidades de melhoria

### R6: Padronização de scripts de desenvolvimento entre apps
- **Ação**: Padronizar `dev`, `build`, `start`, `lint`, `typecheck` em todos os apps.

### R7: Documentação de variáveis públicas vs privadas
- **Ação**: Marcar explicitamente no `nuxt.config.ts` o que é público e o que é privado.

### R8: Revisão de dependências duplicadas ou desatualizadas
- **Ação**: Auditar versões compartilhadas entre apps para evitar conflito de dependência.

## Prioridade recomendada

1. R1 e R2
2. R3 e R5
3. R4
4. R6, R7 e R8

## Resumo

O maior risco do monorepo está no acoplamento entre serviços externos, configuração de ambiente e evolução do banco. A disciplina nesses pontos tende a reduzir a maior parte dos incidentes operacionais.
