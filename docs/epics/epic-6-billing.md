# EPIC 6: Faturamento e Planos (Stripe)

**Status:** Done
**Prioridade:** Alta

## Visão Geral
Este épico trata da integração completa de cobrança do SaaS, permitindo a monetização da plataforma. O foco principal é restringir funcionalidades (como número de agentes ilimitados vs gratuitos) com base na saúde da assinatura mantida junto à Stripe.

## Funcionalidades Principais
1. **Página de Assinatura:** Painel para o cliente visualizar seu plano atual, migrar (upgrade/downgrade) e acessar faturas.
2. **Checkout Integration:** API para iniciar seções seguras de pagamento direto no portal da Stripe.
3. **Webhooks de Segurança:** Rota backend para ouvir o disparo contínuo de eventos de pagamento bem-sucedido ou falha (cancelamento), refletindo automaticamente no banco Supabase para bloquear o workspace de imediato.

## User Stories
- [x] **Story 6.1**: Gerenciar Assinatura (Upgrade/Downgrade).
- [x] **Story 6.2**: Webhooks de Atualização (Proteção de Serviço).
