#!/bin/bash
# Script para configurar cron jobs de backup automático do Supabase
# Uso: ./scripts/setup-backup-cron.sh [install|uninstall|status]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Obtém o diretório do projeto
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Define os cron jobs
DAILY_CRON="0 2 * * * cd $PROJECT_DIR && ./scripts/backup-supabase.sh daily >> $PROJECT_DIR/supabase/backups/cron.log 2>&1"
WEEKLY_CRON="0 3 * * 0 cd $PROJECT_DIR && ./scripts/backup-supabase.sh weekly >> $PROJECT_DIR/supabase/backups/cron.log 2>&1"
MONTHLY_CRON="0 4 1 * * cd $PROJECT_DIR && ./scripts/backup-supabase.sh monthly >> $PROJECT_DIR/supabase/backups/cron.log 2>&1"

# Marcador para identificar os cron jobs
CRON_MARKER="# Supabase Backup - wa-saas-monorepo"

show_status() {
    log_info "Status dos backups automáticos:"
    echo ""
    
    if crontab -l 2>/dev/null | grep -q "$CRON_MARKER"; then
        log_info "✅ Backups automáticos ATIVOS"
        echo ""
        echo "Agendamentos configurados:"
        crontab -l 2>/dev/null | grep -A3 "$CRON_MARKER"
        echo ""
        
        # Mostra próximas execuções
        log_info "Próximas execuções:"
        echo "  • Backup diário: Todos os dias às 02:00"
        echo "  • Backup semanal: Domingos às 03:00"
        echo "  • Backup mensal: Dia 1 de cada mês às 04:00"
        
        # Mostra último backup
        if [ -f "$PROJECT_DIR/supabase/backups/last/backup_latest.sql.gz" ]; then
            echo ""
            log_info "Último backup:"
            ls -lh "$PROJECT_DIR/supabase/backups/last/backup_latest.sql.gz" | awk '{print "  " $6 " " $7 " " $8 " - " $5}'
        fi
        
        # Mostra log recente se existir
        if [ -f "$PROJECT_DIR/supabase/backups/cron.log" ]; then
            echo ""
            log_info "Últimas 5 linhas do log:"
            tail -5 "$PROJECT_DIR/supabase/backups/cron.log" | sed 's/^/  /'
        fi
    else
        log_warn "❌ Backups automáticos NÃO CONFIGURADOS"
        echo ""
        log_info "Para ativar, execute:"
        log_info "./scripts/setup-backup-cron.sh install"
    fi
}

install_cron() {
    log_info "Instalando cron jobs de backup..."
    
    # Verifica se já está instalado
    if crontab -l 2>/dev/null | grep -q "$CRON_MARKER"; then
        log_warn "Backups automáticos já estão configurados!"
        log_question "Deseja reinstalar? (S/n): "
        read -r RESPONSE
        if [ "$RESPONSE" != "S" ] && [ "$RESPONSE" != "s" ]; then
            log_info "Operação cancelada."
            exit 0
        fi
        uninstall_cron
    fi
    
    # Cria diretório de logs
    mkdir -p "$PROJECT_DIR/supabase/backups"
    
    # Adiciona os cron jobs
    (crontab -l 2>/dev/null || echo ""; echo ""; echo "$CRON_MARKER"; echo "$DAILY_CRON"; echo "$WEEKLY_CRON"; echo "$MONTHLY_CRON") | crontab -
    
    # Torna os scripts executáveis
    chmod +x "$PROJECT_DIR/scripts/backup-supabase.sh"
    chmod +x "$PROJECT_DIR/scripts/restore-supabase.sh"
    
    log_info "================================"
    log_info "✅ Backups automáticos configurados!"
    log_info "================================"
    echo ""
    echo "Agendamentos:"
    echo "  • Backup diário: Todos os dias às 02:00"
    echo "  • Backup semanal: Domingos às 03:00"
    echo "  • Backup mensal: Dia 1 de cada mês às 04:00"
    echo ""
    log_info "Logs serão salvos em: $PROJECT_DIR/supabase/backups/cron.log"
    echo ""
    log_info "Para verificar status: ./scripts/setup-backup-cron.sh status"
    log_info "Para desinstalar: ./scripts/setup-backup-cron.sh uninstall"
}

uninstall_cron() {
    log_info "Removendo cron jobs de backup..."
    
    if ! crontab -l 2>/dev/null | grep -q "$CRON_MARKER"; then
        log_warn "Nenhum cron job de backup encontrado."
        exit 0
    fi
    
    # Remove os cron jobs
    crontab -l 2>/dev/null | grep -v "$CRON_MARKER" | grep -v "wa-saas-monorepo" | crontab -
    
    log_info "✅ Backups automáticos removidos!"
    echo ""
    log_info "Os backups existentes NÃO foram removidos."
    log_info "Eles continuam disponíveis em: $PROJECT_DIR/supabase/backups/"
}

# Comando principal
COMMAND="${1:-status}"

case $COMMAND in
    install)
        install_cron
        ;;
    uninstall)
        uninstall_cron
        ;;
    status)
        show_status
        ;;
    *)
        log_error "Comando inválido: $COMMAND"
        echo ""
        log_info "Uso: $0 [install|uninstall|status]"
        echo ""
        echo "Comandos:"
        echo "  install   - Instala os cron jobs de backup automático"
        echo "  uninstall - Remove os cron jobs de backup automático"
        echo "  status    - Mostra o status dos backups automáticos"
        exit 1
        ;;
esac