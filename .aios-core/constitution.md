# Constitution - Synkra AIOS

## Princípios Fundamentais

### 1. CLI First, Observability Second, UI Third

- Priorize soluções via linha de comando
- Adicione observabilidade/logs antes de criar interfaces
- UI é a última camada, nunca a primeira

### 2. Development Driven by Stories

- Todo desenvolvimento deve estar vinculado a uma story em `docs/stories/`
- Não invente requisitos fora dos artefatos existentes
- Cada story deve ter checklist e file list atualizados

### 3. Quality Gates

- Código só avança após passar:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test`
- Nenhuma exceção, nenhum bypass

### 4. Type Safety First

- Use TypeScript estrito em todo o código
- Compartilhe tipos via `packages/shared`
- Evite `any` a todo custo

### 5. Monorepo Consistency

- Mantenha dependências sincronizadas entre workspaces
- Use workspace protocol quando aplicável
- Builds devem ser deterministicos

## Workflow de Desenvolvimento

### Antes de Iniciar

1. Leia a story completa em `docs/stories/`
2. Verifique dependências e pré-requisitos
3. Execute `npm run validate:structure`

### Durante o Desenvolvimento

1. Trabalhe iterativamente
2. Commit pequeno e frequente
3. Atualize checklist da story progressivamente
4. Execute quality gates localmente

### Antes de Concluir

1. Todos os quality gates devem passar
2. Checklist da story deve estar 100% completa
3. File list da story deve estar atualizada
4. Documentação deve estar sincronizada

## Code Standards

### TypeScript

- Strict mode habilitado
- Preferir interfaces sobre types
- Usar path aliases configurados no tsconfig

### Vue/Nuxt

- Composition API com `<script setup>`
- TypeScript em todos os componentes
- Props e emits tipados

### Node/API

- Async/await sobre callbacks
- Error handling consistente
- Logging estruturado

### Testes

- Cobertura mínima: 70%
- Unit tests obrigatórios para lógica de negócio
- E2E para fluxos críticos

## Git Workflow

### Branches

- `main`: produção estável
- `develop`: integração contínua
- `feature/*`: novas funcionalidades
- `fix/*`: correções
- `story/*`: vinculado a stories

### Commits

- Formato: `type(scope): message`
- Types: feat, fix, docs, refactor, test, chore
- Mensagens em pt-BR, claras e objetivas

### Pull Requests

- Título descritivo
- Referência à story
- Checklist de quality gates
- Review obrigatório

## Agent Collaboration

### Quando Invocar Agents

- `@architect`: Decisões de arquitetura
- `@dev`: Implementação de código
- `@qa`: Testes e qualidade
- `@pm`/`@po`: Alinhamento de produto
- `@devops`: Deploy e infraestrutura
- `@ux-design-expert`: Design de interfaces

### Comunicação Entre Agents

- Use linguagem clara e técnica
- Documente decisões importantes
- Mantenha contexto nas threads

## Observabilidade

### Logs

- Estruturados (JSON)
- Níveis: error, warn, info, debug
- Contexto rico (request_id, user_id, etc.)

### Métricas

- Performance de endpoints
- Taxa de erro
- Uso de recursos

### Alertas

- Erros críticos
- Degradação de performance
- Falhas de integração

## Segurança

### Dados Sensíveis

- Nunca commit de secrets
- Use variáveis de ambiente
- Rotação regular de credenciais

### Autenticação/Autorização

- JWT para APIs
- Row Level Security no Supabase
- Validação rigorosa de inputs

### Dependências

- Auditoria regular (`npm audit`)
- Updates de segurança prioritários
- Verificação de licenças

## Performance

### Frontend

- Lazy loading de componentes
- Code splitting
- Otimização de assets

### Backend

- Cache estratégico
- Query optimization
- Connection pooling

### Database

- Indexes apropriados
- Queries eficientes
- Migrations versionadas

---

**Esta constitution é viva e deve evoluir com o projeto.**
