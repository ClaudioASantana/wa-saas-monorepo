# Sugestão Inicial de Análise

*Data: 2026-06-25*

---

## Observações Gerais sobre o CRM WhatsApp

### O que é forte

- **Arquitetura multi-tenant clara** com `tenant_id` e foco em isolamento.
- **Separação do motor WhatsApp** em serviço próprio: boa decisão para estabilidade.
- **Uso de fila/Redis** para webhook, mídia e webhooks: evita travar a API.
- **Stories como fonte de verdade**: mantém o escopo controlado.

### O que merece atenção

- **Consistência do isolamento multi-tenant**: qualquer rota esquecida sem filtro por `tenant_id` vira vazamento de dados.
- **Autenticação e autorização**: login ≠ acesso. Precisa garantir papéis e escopos por workspace.
- **Idempotência real nos webhooks**: WhatsApp duplica eventos com facilidade; sem dedupe, o CRM fica inconsistente.
- **Observabilidade**: sem tracing/logs estruturados, fica difícil depurar mensagens perdidas, fila travada ou sessão quebrada.
- **Resiliência do Baileys**: é o ponto mais sensível do sistema; precisa de reconexão, watchdog e isolamento de falhas.
- **Billing como trava de produto**: se Stripe falhar ou webhook atrasar, o bloqueio de acesso precisa ser bem desenhado.

### Sugestões práticas

1. Colocar `tenant_id` como regra obrigatória em toda query e service.
2. Criar um contrato único de eventos para mensagens, chats e webhooks, com versionamento.
3. Instrumentar fila e websocket com logs correlacionados por `tenant_id`, `conversation_id` e `message_id`.
4. Tratar reprocessamento como caso normal, não exceção.
5. Adicionar saúde operacional do motor WhatsApp e das filas em um dashboard simples.

### Visão geral

O projeto parece bem pensado e com boa direção técnica. O maior risco não é "falta de feature", e sim **complexidade operacional**: multi-tenant, WhatsApp não-oficial, filas, webhook duplicado e billing podem criar bugs difíceis se não houver disciplina de isolamento e observabilidade.

---

## Plano de Análise por Tema

Análises realizadas em sequência:

1. [Arquitetura](01-arquitetura.md)
2. [Segurança](02-seguranca.md)
3. [Escalabilidade](03-escalabilidade.md)
4. [UX do CRM](04-ux-crm.md)
5. [Riscos do Motor WhatsApp](05-motor-whatsapp.md)
