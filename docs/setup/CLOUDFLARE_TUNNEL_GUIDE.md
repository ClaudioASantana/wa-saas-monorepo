# Guia de Configuração do Cloudflare Tunnel

Este guia explica como configurar o Cloudflare Tunnel para expor sua aplicação local para a internet com um domínio real.

## 📋 Índice

- [O que é Cloudflare Tunnel?](#o-que-é-cloudflare-tunnel)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração Inicial](#configuração-inicial)
- [Estrutura de Domínios](#estrutura-de-domínios)
- [Uso Diário](#uso-diário)
- [Troubleshooting](#troubleshooting)
- [Segurança](#segurança)

## 🎯 O que é Cloudflare Tunnel?

Cloudflare Tunnel (anteriormente Argo Tunnel) cria uma conexão segura entre sua máquina local e a rede do Cloudflare, sem precisar:

- ✅ Abrir portas no firewall
- ✅ Configurar port forwarding no roteador
- ✅ Ter IP público estático
- ✅ Gerenciar certificados SSL manualmente

**Benefícios**:

- 🔒 **Segurança**: Tráfego criptografado end-to-end
- 🌍 **Global**: CDN e proteção DDoS do Cloudflare
- 🚀 **Rápido**: Cache e otimização automática
- 💰 **Grátis**: Uso básico não tem custo
- 🔗 **Webhooks**: Perfeito para receber webhooks da Stripe

## 📋 Pré-requisitos

1. **Conta no Cloudflare** (gratuita)
   - Crie em: https://dash.cloudflare.com/sign-up

2. **Domínio gerenciado pelo Cloudflare**
   - Transfira seu domínio para o Cloudflare DNS
   - Ou compre um domínio diretamente no Cloudflare

3. **Docker instalado e rodando**

   ```bash
   docker --version
   docker-compose --version
   ```

4. **cloudflared CLI** (será instalado no próximo passo)

## 🔧 Instalação

### Linux (Debian/Ubuntu)

```bash
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

### macOS

```bash
brew install cloudflare/cloudflare/cloudflared
```

### Windows

Baixe o instalador em:
https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

### Verificar Instalação

```bash
cloudflared --version
```

## ⚙️ Configuração Inicial

### Passo 1: Executar o Script de Setup

```bash
./scripts/setup-cloudflare-tunnel.sh setup
```

Este script interativo irá:

1. **Autenticar** - Abrirá o navegador para você fazer login no Cloudflare
2. **Criar Tunnel** - Criará um tunnel com o nome especificado
3. **Configurar Credentials** - Copiará as credenciais para o projeto
4. **Atualizar Configuração** - Substituirá "seudominio.com" pelo seu domínio real
5. **Criar Registros DNS** - Configurará automaticamente os CNAMEs necessários

### Passo 2: Informações Solicitadas

Durante o setup, você precisará fornecer:

- **Nome do Tunnel** (padrão: wa-saas-tunnel)
  - Use um nome descritivo para identificar facilmente
- **Seu Domínio** (ex: meusite.com)
  - Deve estar configurado no Cloudflare DNS
  - Não inclua "www" ou outros subdomínios

### Passo 3: Verificar Configuração

```bash
./scripts/setup-cloudflare-tunnel.sh test
```

Isso validará:

- ✅ Arquivo de configuração correto
- ✅ Credentials válidas
- ✅ Regras de ingress corretas

## 🌐 Estrutura de Domínios

Após a configuração, você terá os seguintes domínios:

| Subdomínio                | Serviço         | Porta Interna | Descrição                             |
| ------------------------- | --------------- | ------------- | ------------------------------------- |
| `seudominio.com`          | marketing       | 3001          | Landing Page / Site Institucional     |
| `www.seudominio.com`      | marketing       | 3001          | Alias para landing page               |
| `api.seudominio.com`      | api             | 4000          | API Backend REST                      |
| `app.seudominio.com`      | web             | 3000          | Dashboard / Aplicação Web             |
| `whatsapp.seudominio.com` | whatsapp-engine | 3001          | Engine do WhatsApp                    |
| `webhooks.seudominio.com` | api             | 4000          | Endpoints para webhooks (Stripe, etc) |

### Exemplos de Uso

```bash
# Landing Page
https://meusite.com
https://www.meusite.com

# API
https://api.meusite.com/health
https://api.meusite.com/v1/auth/login

# Dashboard
https://app.meusite.com

# Webhooks da Stripe
https://webhooks.meusite.com/stripe/webhook
```

## 🚀 Uso Diário

### Iniciar o Tunnel

```bash
# Via script
./scripts/setup-cloudflare-tunnel.sh start

# Ou via docker-compose
docker-compose up -d cloudflare-tunnel
```

### Verificar Status

```bash
./scripts/setup-cloudflare-tunnel.sh status
```

### Ver Logs

```bash
docker logs wa-cloudflare-tunnel -f
```

### Parar o Tunnel

```bash
# Via script
./scripts/setup-cloudflare-tunnel.sh stop

# Ou via docker-compose
docker-compose stop cloudflare-tunnel
```

### Reiniciar

```bash
docker-compose restart cloudflare-tunnel
```

## 🔧 Troubleshooting

### Problema: "tunnel credentials file not found"

**Causa**: Arquivo `cloudflare-credentials.json` não existe

**Solução**:

```bash
./scripts/setup-cloudflare-tunnel.sh setup
```

### Problema: "failed to sufficiently increase receive buffer size"

**Causa**: Limite de buffer do sistema operacional

**Solução** (Linux):

```bash
sudo sysctl -w net.core.rmem_max=2500000
```

Para tornar permanente, adicione em `/etc/sysctl.conf`:

```
net.core.rmem_max=2500000
```

### Problema: DNS não está resolvendo

**Solução**:

1. Verifique se o domínio está no Cloudflare:

   ```bash
   cloudflared tunnel route dns list
   ```

2. Force a criação dos registros:

   ```bash
   TUNNEL_ID=$(cloudflared tunnel list | grep wa-saas | awk '{print $1}')
   cloudflared tunnel route dns $TUNNEL_ID seudominio.com
   ```

3. Aguarde propagação DNS (pode levar até 5 minutos)

### Problema: Serviço não está respondendo

**Verificar**:

1. Serviços locais estão rodando?

   ```bash
   docker-compose ps
   ```

2. Tunnel está rodando?

   ```bash
   docker logs wa-cloudflare-tunnel
   ```

3. Configuração está correta?
   ```bash
   ./scripts/setup-cloudflare-tunnel.sh test
   ```

### Problema: SSL/TLS errors

**Causa**: Configuração de SSL no Cloudflare

**Solução**:

1. Acesse o Dashboard do Cloudflare
2. Vá em **SSL/TLS** > **Overview**
3. Configure para **Full** (não Full Strict)

### Problema: 502 Bad Gateway

**Causas comuns**:

1. Serviço local não está rodando
2. Porta incorreta na configuração
3. Serviço demorou muito para responder

**Solução**:

```bash
# Verificar serviços
docker-compose ps

# Ver logs do serviço específico
docker logs wa-api
docker logs wa-web
docker logs wa-marketing

# Reiniciar serviços
docker-compose restart
```

## 🔒 Segurança

### Proteger Credentials

O arquivo `cloudflare-credentials.json` contém informações sensíveis e **NUNCA** deve ser commitado no Git.

Já está no `.gitignore`, mas verifique:

```bash
git status cloudflare-credentials.json
# Deve mostrar: não rastreado ou ignorado
```

### Limitar Acesso por IP (Opcional)

No Dashboard do Cloudflare:

1. Vá em **Security** > **WAF**
2. Crie uma regra para limitar acesso a IPs específicos
3. Exemplo: Permitir apenas IPs da sua empresa

### Habilitar Cloudflare Access (Opcional)

Para proteção adicional em ambientes de staging:

1. Vá em **Zero Trust** no Dashboard
2. Configure **Cloudflare Access**
3. Exija autenticação antes de acessar `app.seudominio.com`

### Rate Limiting

Configure rate limiting no Cloudflare para proteger contra:

- DDoS
- Brute force
- Scraping

### Logs e Monitoramento

O Cloudflare fornece:

- Analytics detalhados
- Logs de requisições
- Alertas de segurança
- Métricas de performance

Acesse em: **Analytics** no Dashboard

## 📝 Configuração Avançada

### Customizar Timeouts

Edite `cloudflare-tunnel.yml`:

```yaml
ingress:
  - hostname: api.seudominio.com
    service: http://api:4000
    originRequest:
      connectTimeout: 60s # Tempo para conectar
      tlsTimeout: 20s # Timeout TLS
      tcpKeepAlive: 30s # Keep-alive
      noHappyEyeballs: false # HTTP/2
```

### Adicionar Novo Subdomínio

1. Edite `cloudflare-tunnel.yml`:

   ```yaml
   ingress:
     - hostname: novo.seudominio.com
       service: http://novo-servico:porta
   ```

2. Valide:

   ```bash
   ./scripts/setup-cloudflare-tunnel.sh test
   ```

3. Crie registro DNS:

   ```bash
   TUNNEL_ID=$(cloudflared tunnel list | grep wa-saas | awk '{print $1}')
   cloudflared tunnel route dns $TUNNEL_ID novo.seudominio.com
   ```

4. Reinicie:
   ```bash
   docker-compose restart cloudflare-tunnel
   ```

### Load Balancing

Para múltiplas instâncias:

```yaml
ingress:
  - hostname: api.seudominio.com
    service: http://api-1:4000,http://api-2:4000,http://api-3:4000
    originRequest:
      noTLSVerify: true
```

## 🎯 Casos de Uso

### 1. Receber Webhooks da Stripe

Configure no Dashboard da Stripe:

```
Endpoint URL: https://webhooks.seudominio.com/stripe/webhook
```

### 2. Testar Pagamentos em Produção

Use o tunnel para testar pagamentos reais sem deploy:

```
Teste localmente com: https://app.seudominio.com
```

### 3. Demo para Clientes

Mostre features novas sem fazer deploy:

```
Compartilhe: https://app.seudominio.com
```

### 4. Desenvolvimento Colaborativo

Toda equipe acessa a mesma instância local:

```
Time acessa: https://app.seudominio.com
```

## 📚 Recursos Adicionais

- [Documentação Oficial do Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Cloudflare Zero Trust](https://www.cloudflare.com/zero-trust/)
- [Cloudflare Analytics](https://developers.cloudflare.com/analytics/)
- [Cloudflare WAF](https://developers.cloudflare.com/waf/)

## 🚦 Próximos Passos

Após configurar o tunnel:

1. [ ] Testar todos os endpoints
2. [ ] Configurar webhooks da Stripe
3. [ ] Habilitar Analytics no Cloudflare
4. [ ] Configurar alertas de downtime
5. [ ] Documentar URLs para a equipe
6. [ ] Configurar rate limiting
7. [ ] Habilitar Cloudflare Access para staging
