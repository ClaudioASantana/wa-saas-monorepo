#!/bin/bash
# Script para backup do Supabase local

# Carrega variáveis do .env se existir
if [ -f .env ]; then
  set -o allexport
  source .env
  set +o allexport
fi

# Define data/hora para o nome do arquivo
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="supabase/backups"
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Cria a pasta caso não exista
mkdir -p "$BACKUP_DIR"

echo "Iniciando o backup do banco de dados local do Supabase..."

# Verifica se a DATABASE_URL está definida
if [ -z "$DATABASE_URL" ]; then
  echo "❌ A variável DATABASE_URL não está definida no arquivo .env."
  exit 1
fi

# Usa pg_dump com a DATABASE_URL do .env
pg_dump "$DATABASE_URL" \
  --schema=public \
  --blobs \
  --file="$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "✅ Backup concluído com sucesso! Arquivo gerado: $BACKUP_FILE"
  # Comprime o arquivo
  gzip "$BACKUP_FILE"
  echo "✅ Arquivo comprimido para: $BACKUP_FILE.gz"
else
  echo "❌ Falha ao realizar o backup do banco de dados."
  exit 1
fi