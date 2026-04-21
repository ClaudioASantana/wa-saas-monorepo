# Benchmark Arquitetural: Evolution API (Motor Core)

**Objetivo:** Analisar e mapear os principais componentes do "motor" da Evolution API para servir como referência (benchmark) na construção ou melhoria da arquitetura de integração com WhatsApp do `wa-saas-monorepo`.

O Evolution API é um dos projetos open-source mais proeminentes para integração com o WhatsApp via a biblioteca `@whiskeysockets/baileys`. Para manter estabilidade em escala SaaS, ele precisou resolver problemas clássicos desta biblioteca e do protocolo Web.

## 1. Mapeamento da Camada de Sessão (Baileys Session Manager)

A gestão de milhares de sessões é o calcanhar de aquiles das integrações WhatsApp Web. A Evolution adotou estratégias claras:

*   **Isolamento em Memória:** Ao invés de um único processo gigantesco, as conexões ativas do Baileys ficam cacheadas na memória. Múltiplas conexões exigem alto uso de RAM, por isso o isolamento horizontal (gerenciamento por pods ou instâncias) é implementado.
*   **Persistência de Estado Genérica (Auth Keys):** O Baileys gera inúmeras chaves criptográficas (Signal keys, pre-keys) dinamicamente. A Evolution resolveu a persistência desse estado (que nativamente seria num JSON na pasta `sessions`) implementando adaptadores customizados que podem salvar o estado no **PostgreSQL (Prisma)**, **MongoDB** ou **Redis**.
    *   *Insight para nosso projeto:* Nunca armazenar o estado localmente em arquivos no disco (volume) se desejamos ser uma plataforma multi-tenant escalável na AWS/GCP.
*   **Reconexão Automática e Tratamento de Quedas:** A biblioteca lida duramente com fechamentos de socket (códigos como 428, 440, 500). O motor da Evolution possui funções que verificam de forma granular o `DisconnectReason` fornecido pelo Boom do HapiJS, reconectando silenciosamente ou limpando o estado (logouting) forçadamente se o celular de fato desconectou.

## 2. A Camada de Filas (Workers & Message Brokers)

O processamento em tempo real do WhatsApp não suporta operações síncronas bloqueantes. A adoção de Brokers (RabbitMQ / SQS) é o pulo arquitetural da ferramenta visando estabilidade.

*   **O Problema Resolvido:** Quando o socket `messages.upsert` decola, ele pode disparar 100 mensagens por segundo em um grande lançamento ou spam. Se tentássemos parsear dados, buscar no BD e disparar HTTP Requests, a flag de heartbeats do WhatsApp expiraria, derrubando a sessão.
*   **Arquitetura Publisher-Consumer:**
    *   **Produtores:** A escuta do Baileys é enxuta. A Evolution apenas converte a mensagem pura bruta interceptada e **enfilera** num serviço de fila (ex: RabbitMQ).
    *   **Consumidores (Workers):** Instâncias de background da Evolution (que podem ser separadas do Node de conexão do Baileys) sugam essas filas, fazem formatações mais pesadas, parse de mídia e decidem a regra de negócio.
    *   *Insight para nosso projeto:* A comunicação entre nosso Motor WA e a API NodeJs Core do projeto deve ser prioritariamente assíncrona por Message Broker/Redis para suportar picos de uso dos clientes de CRM.

## 3. Fluxo de Entrega de Webhooks

A forma de informar os CRMs/atendentes que uma conversa ocorreu precisa ser robusta:

*   De forma desacoplada, o Worker que "lê" a fila pega o evento, traduz o payload confuso do Baileys (protobuf) para uma estrutura JSON limpa (com remetente, conteúdo, se é mimetype de imagem, url, e base64).
*   Um despachante de Webhooks é então acionado. A chamada HTTP é acompanhada de configurações de *Retry Policy*. Se o endpoint do cliente estiver inativo, a fila remarcará tentativas baseadas num backoff temporal (1m, 5m, 1h).

## 4. Persistência de Dados e Tratamento de Mídia

*   **O "Cache" do Prisma:** A Evolution suporta salvar os históricos das conexões no banco de relacional ou no-sql da preferência do host. Mas armazenar todas as interações no engine pode inflar a base de dados. Soluções como Evolution Lite tendem a focar mais em processamento em tempo real do que retenção de banco de dados prolongada para features do Baileys store.
*   **Armazenamento de Mídias (S3/MinIO):** A descriptografia da mídia não é enviada necessariamente como buffer (base64) pelo socket que ficaria terrivelmente alocado em memória, e sim feita streaming e em seguida upada num ambiente de persistência cloud compatível com S3 para repassar as URL's para as conversas do usuário.

## Conclusões Arquiteturais para o WA SaaS Monorepo

> [!IMPORTANTE]
> A Evolution API prova que a ponte entre WhatsApp e API precisa ser um ecossistema à parte (um microsserviço). Tentar colocar o Socket do Baileys e as controladoras RESTful CRUD na mesma porta de memória tende ao crash rápido numa escala SaaS com mais de 20 clientes ativos.

1. **Abstração:** Criar um microserviço Node puro ou Go (inspirado no Evolution Go) apenas para "falar" Baileys.
2. **Integração Async:** Este núcleo irá enviar os status nas filas, o backend do WA CRM lerá a fila e fará as magias de lógica do sistema.
3. **Persistência de State no PostgreSQL ou Redis.** Nada em disco.

---
*Análise documentada na sessão de brainstorming estrutural para o projeto Evolution Benchmark.*
