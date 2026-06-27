# Análise de Riscos do Motor WhatsApp

*Data: 2026-06-25*

---

## Visão geral

O motor WhatsApp é o componente mais sensível do sistema. Ele concentra os riscos de estabilidade, reconexão, sessões, duplicidade de eventos e comportamento imprevisível de uma integração não-oficial.

## Pontos fortes

- **Isolamento em serviço próprio** reduz o raio de falha.
- **Uso de fila** ajuda a evitar travamentos em processamento pesado.
- **Abordagem assíncrona** é a certa para webhooks, mídia e sincronização de mensagens.

## Pontos de atenção

- **Instabilidade do Baileys**: reconexão, quedas de sessão e mudanças no comportamento do WhatsApp podem quebrar o fluxo.
- **Duplicidade de mensagens/eventos**: sem idempotência, a interface pode mostrar duplicatas ou estados inconsistentes.
- **Consumo de memória**: sessões e conexões podem crescer de forma imprevisível.
- **Observabilidade insuficiente**: sem logs e métricas por sessão/tenant, o diagnóstico fica muito difícil.
- **Dependência de um canal não-oficial**: a mudança externa pode afetar o produto sem aviso.

## Leitura crítica

Esse componente não pode ser tratado como um detalhe de integração. Ele é um motor operacional com risco estrutural. Se falhar, o usuário sente na hora, porque o produto gira em torno dele. Por isso, isolamento, retries, watchdog e dedupe não são “melhorias”, são requisitos de sobrevivência.

## Conclusão

O motor WhatsApp é o maior ponto de risco técnico do projeto. A estratégia correta é mantê-lo isolado, monitorado e idempotente, com tolerância a falhas como premissa.
