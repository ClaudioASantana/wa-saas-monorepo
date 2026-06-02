#!/bin/sh
# patch-baileys.sh - GLOBAL FIX para versão do protocolo WhatsApp na Evolution API

OLD_VERSION="1015901307"
NEW_VERSION="1033846690"
BASE_DIR="/evolution"

echo "Iniciando patch GLOBAL do Baileys para a versão $NEW_VERSION..."

# 1. Patch no arquivo de defaults do Baileys (fallback)
VERSION_FILE="$BASE_DIR/node_modules/baileys/lib/Defaults/baileys-version.json"
if [ -f "$VERSION_FILE" ]; then
    sed -i "s/$OLD_VERSION/$NEW_VERSION/g" "$VERSION_FILE"
    echo "Patch aplicado em $VERSION_FILE"
fi

# 2. Patch GLOBAL em todo o diretório dist/ e /evolution (força bruta para bundle compilado)
echo "Executando patch global em todo o diretório /evolution..."
find "$BASE_DIR" -type f -exec grep -l "$OLD_VERSION" {} + | xargs sed -i "s/$OLD_VERSION/$NEW_VERSION/g"
echo "Patch global concluído."

# 3. Patch específico para a lógica de 'version env' no whatsapp.baileys.service.js
SERVICE_FILE="$BASE_DIR/dist/api/integrations/channel/whatsapp/whatsapp.baileys.service.js"
if [ -f "$SERVICE_FILE" ]; then
    sed -i 's/t.VERSION?/(t.VERSION||"2.3000.'$NEW_VERSION'")?/g' "$SERVICE_FILE"
    sed -i 's/t\.VERSION\.split/(t.VERSION||"2.3000.'$NEW_VERSION'").split/g' "$SERVICE_FILE"
    echo "Patch de lógica aplicado em $SERVICE_FILE"
fi

echo "Baileys GLOBAL patch finalizado com sucesso."
