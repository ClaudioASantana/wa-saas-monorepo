#!/bin/bash
# Script para configurar Cloudflare Tunnel
# Uso: ./scripts/setup-cloudflare-tunnel.sh [setup|test|start|stop|status]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Função para log
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_question() {
    echo -e "${BLUE}[?]${NC} $1"
}

log_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

# Obtém o diretório do projeto
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Arquivos necessários
CONFIG_FILE="$PROJECT_DIR/cloudflare-tunnel.yml"
CREDENTIALS_FILE="$PROJECT_DIR/cloudflare-credentials.json"
EXAMPLE_CREDENTIALS="$PROJECT_DIR/cloudflare-credentials.example.json"

setup_tunnel() {
    log_info "===================================="
    log_info "Cloudflare Tunnel Setup"
    log_info "===================================="
    echo ""
    
    # Verifica se cloudflared está instalado
    if ! command -v cloudflared &> /dev/null; then
        log_error "cloudflared não está instalado!"
        echo ""
        log_info "Para instalar:"
        echo ""
        echo "Linux (Debian/Ubuntu):"
        echo "  wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb"
        echo "  sudo dpkg -i cloudflared-linux-amd64.deb"
        echo ""
        echo "macOS:"
        echo "  brew install cloudflare/cloudflare/cloudflared"
        echo ""
        echo "Windows:"
        echo "  Baixe em: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
        echo ""
        exit 1
    fi
    
    log_info "✅ cloudflared instalado: $(cloudflared --version | head -1)"
    echo ""
    
    # Passo 1: Login
    log_step "1/5 - Autenticação no Cloudflare"
    log_info "Abrindo navegador para autenticação..."
    echo ""
    
    if cloudflared tunnel login; then
        log_info "✅ Autenticação concluída!"
    else
        log_error "Falha na autenticação"
        exit 1
    fi
    echo ""
    
    # Passo 2: Criar tunnel
    log_step "2/5 - Criar Tunnel"
    log_question "Nome do tunnel (padrão: wa-saas-tunnel): "
    read -r TUNNEL_NAME
    TUNNEL_NAME=${TUNNEL_NAME:-wa-saas-tunnel}
    
    log_info "Criando tunnel: $TUNNEL_NAME"
    if cloudflared tunnel create "$TUNNEL_NAME"; then
        log_info "✅ Tunnel criado com sucesso!"
    else
        log_warn "Tunnel pode já existir. Tentando listar..."
        cloudflared tunnel list
    fi
    echo ""
    
    # Passo 3: Obter tunnel ID e credentials
    log_step "3/5 - Obter Tunnel ID"
    TUNNEL_ID=$(cloudflared tunnel list | grep "$TUNNEL_NAME" | awk '{print $1}')
    
    if [ -z "$TUNNEL_ID" ]; then
        log_error "Não foi possível encontrar o tunnel ID"
        log_info "Execute: cloudflared tunnel list"
        exit 1
    fi
    
    log_info "Tunnel ID: $TUNNEL_ID"
    echo ""
    
    # Localiza o arquivo de credentials
    CRED_FILE="$HOME/.cloudflared/$TUNNEL_ID.json"
    
    if [ ! -f "$CRED_FILE" ]; then
        log_error "Arquivo de credentials não encontrado: $CRED_FILE"
        exit 1
    fi
    
    log_info "Copiando credentials para o projeto..."
    cp "$CRED_FILE" "$CREDENTIALS_FILE"
    log_info "✅ Credentials copiadas!"
    echo ""
    
    # Passo 4: Atualizar cloudflare-tunnel.yml
    log_step "4/5 - Atualizar Configuração"
    log_question "Qual é o seu domínio? (ex: meudominio.com): "
    read -r DOMAIN
    
    if [ -z "$DOMAIN" ]; then
        log_error "Domínio não pode ser vazio!"
        exit 1
    fi
    
    log_info "Atualizando cloudflare-tunnel.yml..."
    
    # Atualiza o arquivo de config
    sed -i "s/tunnel: wa-saas-tunnel/tunnel: $TUNNEL_ID/" "$CONFIG_FILE"
    sed -i "s/seudominio.com/$DOMAIN/g" "$CONFIG_FILE"
    
    log_info "✅ Configuração atualizada!"
    echo ""
    
    # Passo 5: Configurar DNS
    log_step "5/5 - Configurar DNS no Cloudflare"
    log_info "Criando registros DNS..."
    echo ""
    
    # Cria os registros DNS
    cloudflared tunnel route dns "$TUNNEL_ID" "$DOMAIN" || log_warn "Registro $DOMAIN pode já existir"
    cloudflared tunnel route dns "$TUNNEL_ID" "www.$DOMAIN" || log_warn "Registro www.$DOMAIN pode já existir"
    cloudflared tunnel route dns "$TUNNEL_ID" "api.$DOMAIN" || log_warn "Registro api.$DOMAIN pode já existir"
    cloudflared tunnel route dns "$TUNNEL_ID" "app.$DOMAIN" || log_warn "Registro app.$DOMAIN pode já existir"
    cloudflared tunnel route dns "$TUNNEL_ID" "whatsapp.$DOMAIN" || log_warn "Registro whatsapp.$DOMAIN pode já existir"
    cloudflared tunnel route dns "$TUNNEL_ID" "webhooks.$DOMAIN" || log_warn "Registro webhooks.$DOMAIN pode já existir"
    
    echo ""
    log_info "===================================="
    log_info "✅ Setup Concluído!"
    log_info "===================================="
    echo ""
    echo "Seus domínios configurados:"
    echo "  🌐 Landing Page:    https://$DOMAIN"
    echo "  🌐 Landing Page:    https://www.$DOMAIN"
    echo "  🔌 API:             https://api.$DOMAIN"
    echo "  📱 Dashboard:       https://app.$DOMAIN"
    echo "  💬 WhatsApp:        https://whatsapp.$DOMAIN"
    echo "  🔗 Webhooks:        https://webhooks.$DOMAIN"
    echo ""
    log_info "Para testar: ./scripts/setup-cloudflare-tunnel.sh test"
    log_info "Para iniciar: docker-compose up -d cloudflare-tunnel"
}

test_tunnel() {
    log_info "Testando configuração do tunnel..."
    echo ""
    
    if [ ! -f "$CONFIG_FILE" ]; then
        log_error "Arquivo de configuração não encontrado: $CONFIG_FILE"
        exit 1
    fi
    
    if [ ! -f "$CREDENTIALS_FILE" ]; then
        log_error "Arquivo de credentials não encontrado: $CREDENTIALS_FILE"
        log_info "Execute primeiro: ./scripts/setup-cloudflare-tunnel.sh setup"
        exit 1
    fi
    
    log_info "Validando configuração..."
    if cloudflared tunnel --config "$CONFIG_FILE" ingress validate; then
        log_info "✅ Configuração válida!"
        echo ""
        log_info "Regras de ingress:"
        cloudflared tunnel --config "$CONFIG_FILE" ingress rule https://seudominio.com 2>/dev/null || true
    else
        log_error "Configuração inválida!"
        exit 1
    fi
}

show_status() {
    log_info "Status do Cloudflare Tunnel"
    echo ""
    
    # Verifica se está rodando no Docker
    if docker ps | grep -q wa-cloudflare-tunnel; then
        log_info "✅ Tunnel rodando no Docker"
        echo ""
        log_info "Logs recentes:"
        docker logs wa-cloudflare-tunnel --tail 20
    else
        log_warn "❌ Tunnel não está rodando"
        echo ""
        log_info "Para iniciar: docker-compose up -d cloudflare-tunnel"
    fi
    
    echo ""
    log_info "Tunnels configurados:"
    cloudflared tunnel list 2>/dev/null || log_warn "Nenhum tunnel encontrado"
}

start_tunnel() {
    log_info "Iniciando Cloudflare Tunnel via Docker..."
    docker-compose up -d cloudflare-tunnel
    
    echo ""
    log_info "Aguardando tunnel iniciar..."
    sleep 3
    
    docker logs wa-cloudflare-tunnel --tail 10
}

stop_tunnel() {
    log_info "Parando Cloudflare Tunnel..."
    docker-compose stop cloudflare-tunnel
    log_info "✅ Tunnel parado!"
}

# Comando principal
COMMAND="${1:-status}"

case $COMMAND in
    setup)
        setup_tunnel
        ;;
    test)
        test_tunnel
        ;;
    start)
        start_tunnel
        ;;
    stop)
        stop_tunnel
        ;;
    status)
        show_status
        ;;
    *)
        log_error "Comando inválido: $COMMAND"
        echo ""
        log_info "Uso: $0 [setup|test|start|stop|status]"
        echo ""
        echo "Comandos:"
        echo "  setup  - Configura o Cloudflare Tunnel pela primeira vez"
        echo "  test   - Valida a configuração do tunnel"
        echo "  start  - Inicia o tunnel via Docker"
        echo "  stop   - Para o tunnel"
        echo "  status - Mostra o status do tunnel"
        exit 1
        ;;
esac