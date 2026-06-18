#!/bin/bash
# Setup inicial do relay-email no servidor
# Uso: bash <(curl -s https://raw.githubusercontent.com/athoszeeps/relay-email/main/setup.sh)
# Ou:  git clone ... && bash setup.sh

set -e

REPO_DIR="/opt/relay-email"
REPO_URL="https://github.com/athoszeeps/relay-email.git"
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; RED='\033[0;31m'; NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      relay-email — setup inicial     ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
echo ""

# --- Pré-requisitos ---
for cmd in docker git openssl; do
  if ! command -v $cmd &>/dev/null; then
    echo -e "${RED}✗ '$cmd' não encontrado. Instale antes de continuar.${NC}"; exit 1
  fi
done
echo -e "${GREEN}✓ docker, git e openssl encontrados${NC}"

# --- Clonar ou atualizar ---
if [ -d "$REPO_DIR/.git" ]; then
  echo -e "${YELLOW}→ Repositório já existe, atualizando...${NC}"
  git -C "$REPO_DIR" pull origin main
else
  echo -e "${YELLOW}→ Clonando repositório...${NC}"
  git clone "$REPO_URL" "$REPO_DIR"
fi
cd "$REPO_DIR"

# --- Coletar apenas o que é segredo ---
echo ""
echo -e "${YELLOW}Informe as credenciais (não aparecem na tela):${NC}"
echo ""

read -rsp "  Senha do SQL Server (usuário sa): " SA_PASSWORD
echo ""

# --- Gerar token seguro ---
RELAY_TOKEN=$(openssl rand -hex 32)

# --- Escrever .env ---
cat > .env << EOF
NODE_ENV=production
PORT=3001
DATABASE_URL=sqlserver://147.93.11.111:1433;database=zeeps_relay;user=sa;password=${SA_PASSWORD};encrypt=true;trustServerCertificate=true
SMTP_HOST=zeeps-com-br.mail.protection.outlook.com
SMTP_PORT=25
SMTP_USER=envios@zeeps.com.br
SMTP_PASSWORD=
RELAY_AUTH_TOKEN=${RELAY_TOKEN}
ALLOWED_SENDERS=envios@zeeps.com.br
LOG_LEVEL=info
EOF

chmod 600 .env
echo -e "${GREEN}✓ .env criado${NC}"

# --- Guardar o token gerado ---
echo "$RELAY_TOKEN" > /root/relay-auth-token.txt
chmod 600 /root/relay-auth-token.txt
echo -e "${GREEN}✓ Token salvo em /root/relay-auth-token.txt${NC}"

# --- Build e start ---
echo ""
echo -e "${YELLOW}→ Buildando e iniciando container...${NC}"
docker compose up -d --build

# --- Migrations ---
echo -e "${YELLOW}→ Aguardando container inicializar...${NC}"
sleep 8
echo -e "${YELLOW}→ Rodando migrations do banco...${NC}"
docker compose exec relay-email npx prisma migrate deploy

# --- Health check ---
echo ""
echo -e "${YELLOW}→ Verificando saúde do serviço...${NC}"
sleep 3
HEALTH=$(curl -sf http://localhost:3001/api/relay/health 2>/dev/null || echo '{"status":"erro"}')
echo "   $HEALTH"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         Setup concluído! ✓           ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"
echo ""
echo -e "  Endpoint:   http://147.93.11.111:3001/api/relay"
echo -e "  Token:      $(cat /root/relay-auth-token.txt)"
echo ""
echo -e "${YELLOW}  Guarde o token acima — ele é necessário para autenticar chamadas à API.${NC}"
echo ""
