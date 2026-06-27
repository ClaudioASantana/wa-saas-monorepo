# Análise de Escalabilidade

*Data: 2026-06-25*

---

## Visão geral

O projeto foi pensado com uma boa base para escalar, principalmente por usar processamento assíncrono, separação de serviços e um motor WhatsApp independente. Isso é importante porque o tráfego do canal WhatsApp pode crescer de forma desigual e imprevisível.

## Pontos fortes

- **BullMQ e Redis** ajudam a absorver picos sem travar a API principal.
- **Separação do motor WhatsApp** reduz o impacto de carga operacional no core do SaaS.
- **Arquitetura multi-tenant** permite crescer em clientes sem duplicar toda a infraestrutura por tenant.
- **Uso de monorepo** facilita reaproveitamento de contratos e acelera evolução.

## Pontos de atenção

- **Escala do motor WhatsApp**: conexões, sessões e reconexões podem se tornar gargalo antes da API.
- **Fila e backpressure**: se o volume de mensagens subir, a fila precisa ter observabilidade e política clara de retenção/prioridade.
- **Queries por tenant**: sem índices e filtros consistentes, o crescimento degrada rapidamente.
- **WebSockets e tempo real**: a experiência de inbox depende de manter latência baixa sem sobrecarregar o servidor.

## Leitura crítica

A escalabilidade do projeto não depende só de “mais servidores”. Depende de o sistema continuar previsível quando o volume crescer. Como o produto é sensível a eventos em tempo real, qualquer gargalo em fila, websocket ou WhatsApp pode parecer indisponibilidade para o usuário, mesmo que a API esteja viva.

## Conclusão

A base escala bem, mas exige disciplina operacional. O foco deve ser manter filas, índices, eventos e conexões sob controle antes de buscar expansão agressiva.
