# Arquitetura & Qualidade: Auditoria de Base (Epic 0)

Após concluir as histórias funcionais do Epic 0, realizei uma análise profunda utilizando os skills de **Clean Code** e **Architecture Patterns**. Abaixo estão os pontos críticos identificados e propostas de melhoria.

## 1. Acoplamento nos Workers (Technical Debt)

Os arquivos `webhook-worker.ts` e `media-worker.ts` estão sobrecarregados. Eles gerenciam:
- Conexão com Supabase/Redis.
- Lógica de negócio (Upsert de contato, lógica de conversas).
- Emissão de eventos Socket.IO.
- Enfileiramento de novos jobs.

> [!IMPORTANT]
> **Risco:** Dificuldade de manutenção e impossibilidade de testes unitários isolados. Se precisarmos criar uma conversa via API ou Dashboard, teremos código duplicado.

**Solução:** Introduzir uma **Service Layer** (`server/services/`).
- `ChatService`: Lógica de mensagens e conversas.
- `ContactService`: Gestão de contatos e CRM.
- `MediaService`: Processamento e upload de arquivos.

## 2. Monolito de UI (`chat.vue`)

O componente `chat.vue` atingiu ~600 linhas. Ele contém:
- Lista de conversas.
- Área de chat e renderização de mensagens.
- Sidebar de detalhes do contato.
- Lógica de Socket.IO.

> [!TIP]
> **Melhoria UX/DevX:** Decompor em componentes menores (`ConversationList.vue`, `MessageBubble.vue`, `ContactDetails.vue`). Isso facilita a aplicação de animações e otimizações de performance individuais.

## 3. Segurança e Tipagem (Robustez)

Atualmente, o payload dos webhooks e dos jobs utiliza `any` em excesso. Além disso, não há validação rigorosa do corpo do webhook antes do enfileiramento.

**Solução:**
- **Zod:** Implementar schemas Zod para validar payloads da Evolution API.
- **Shared Types:** Centralizar interfaces de eventos Socket e payloads de Jobs em um diretório `types/`.

## 4. Observabilidade Pro-Max

Embora tenhamos o `/api/metrics`, podemos elevar o nível:
- **Tracing:** Passar o `request_id` do webhook para os Jobs no BullMQ, permitindo rastrear o caminho de uma mensagem desde a chegada até a exibição no chat nos logs.
- **Dashboard de Filas:** Uma interface administrativa simples para ver jobs falhos e reprocessar manualmente.

---

### Próximos Passos Sugeridos

| Story | Foco | Impacto |
|-------|------|---------|
| **0.7** | Service Layer Refactor | Testabilidade & Reuso de Código |
| **0.8** | UI Componentization | Performance & Manutenibilidade |
| **0.9** | Zod & Strong Typing | Segurança & Erros em Runtime |

O que você acha? Prefere que eu ataque essas refatorações agora para garantir uma base "Elite" ou prefere seguir direto para as funcionalidades do **Team Inbox**?
