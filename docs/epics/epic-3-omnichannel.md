# EPIC 3: Caixa de Entrada Omnicanal (Chat Real-time)

**Status:** Done
**Prioridade:** Alta

## Visão Geral
Este épico foca em construir o "coração" operacional do CRM: o painel de atendimento onde os agentes conversam com os clientes através do WhatsApp. A performance e a sincronia instantânea entre múltiplos agentes usando a ferramenta simultaneamente são pontos críticos, justificados pela escolha do Node.js auxiliar com Socket.io.

## Funcionalidades Principais
1. **Real-time Engine:** Painel de chat (`chat.vue`) sincronizado via websockets para recebimento de mensagens e atualizações sem refresh.
2. **Atribuição & Filtros:** Possibilidade de assumir uma conversa ou enviá-la para outro atendente, filtrando a caixa de entrada para "Meus Atendimentos".
3. **Colaboração:** Indicadores visuais do tipo "Fulano está digitando" e Notas Internas isoladas do cliente final.
4. **Gerenciamento CRM e Smart Routing:** Quadros Kanban (arrastar conversas) e regras automáticas (Round-robin) integrados.

## User Stories
- [x] **Story 3.1**: CRM Kanban Funcional.
- [x] **Story 3.2**: Smart Routing (Distribuição Automática).
- [x] **Story 3.3**: Conversation Assignment (Assumir atendimento).
- [x] **Story 3.4**: Internal Timeline (Notas Internas & Logs).
- [x] **Story 3.5**: Real-time Presence (Status de digitando e onlines).
- [x] **Story 3.6**: Página de Contatos (Listagem global).
