#!/bin/bash
# Uso: ./scripts/build-client.sh <cliente> <plataforma> <perfil>
# Exemplo: ./scripts/build-client.sh alemao android production

CLIENT=$1
PLATFORM=$2
PROFILE=${3:-production}

if [ -z "$CLIENT" ] || [ -z "$PLATFORM" ]; then
  echo "Uso: ./scripts/build-client.sh <cliente> <plataforma> [perfil]"
  echo "Exemplo: ./scripts/build-client.sh alemao android production"
  exit 1
fi

CLIENT_DIR="clients/$CLIENT"
ENV_FILE="$CLIENT_DIR/client.env"
ASSETS_DIR="$CLIENT_DIR/assets"

if [ ! -f "$ENV_FILE" ]; then
  echo "Erro: arquivo $ENV_FILE não encontrado."
  echo "Crie a pasta clients/$CLIENT/ com o arquivo client.env."
  exit 1
fi

echo "=== TechGás Build ==="
echo "Cliente:    $CLIENT"
echo "Plataforma: $PLATFORM"
echo "Perfil:     $PROFILE"
echo ""

# Copiar assets do cliente (se existirem)
if [ -d "$ASSETS_DIR" ]; then
  echo "Copiando assets de $ASSETS_DIR..."
  [ -f "$ASSETS_DIR/icon.png" ]              && cp "$ASSETS_DIR/icon.png"              assets/icon.png
  [ -f "$ASSETS_DIR/adaptive-icon.png" ]     && cp "$ASSETS_DIR/adaptive-icon.png"     assets/adaptive-icon.png
  [ -f "$ASSETS_DIR/splash-icon.png" ]       && cp "$ASSETS_DIR/splash-icon.png"       assets/splash-icon.png
  [ -f "$ASSETS_DIR/notification-icon.png" ] && cp "$ASSETS_DIR/notification-icon.png" assets/notification-icon.png
  echo "Assets copiados."
else
  echo "Aviso: pasta $ASSETS_DIR não encontrada. Usando assets padrão."
fi

# Carregar variáveis do client.env
echo "Carregando configurações de $ENV_FILE..."
export $(grep -v '^#' "$ENV_FILE" | xargs)

echo ""
echo "App:    $EXPO_PUBLIC_APP_NAME"
echo "Bundle: $APP_BUNDLE_ID"
echo "Tenant: $EXPO_PUBLIC_TENANT_SUBDOMAIN"
echo ""

# Executar o build
echo "Iniciando build EAS..."
eas build \
  --platform "$PLATFORM" \
  --profile client \
  --non-interactive

echo ""
echo "Build finalizado para $CLIENT ($PLATFORM / $PROFILE)!"
