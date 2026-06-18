# relay-email

Microsserviço Node.js/Express de relay SMTP intermediário com fila de envio, retry automático e auditoria em SQL Server.

## Pré-requisitos

- Node.js 22+
- Docker + Docker Compose
- SQL Server acessível em `147.93.11.111:1433`

## Setup local

```bash
cp .env.example .env
# Edite .env com as credenciais reais

npm install
npm run db:generate   # gera o Prisma Client
npm run db:migrate    # cria/atualiza tabelas no SQL Server
npm run dev           # inicia com hot-reload
```

## Variáveis de ambiente obrigatórias

| Variável           | Descrição                              |
|--------------------|----------------------------------------|
| `DATABASE_URL`     | Connection string SQL Server           |
| `SMTP_PASSWORD`    | Senha do envios@zeeps.com.br           |
| `RELAY_AUTH_TOKEN` | Token Bearer para autenticação da API  |

Veja `.env.example` para todas as variáveis.

## Endpoints

### `POST /api/relay/send`
Enfileira um e-mail para envio.

**Header:** `Authorization: Bearer {TOKEN}`

**Body:**
```json
{
  "to": "destinatario@example.com",
  "from": "envios@zeeps.com.br",
  "subject": "Assunto",
  "body": "<p>Corpo HTML</p>",
  "replyTo": "reply@zeeps.com.br"
}
```

**Resposta 202:**
```json
{
  "success": true,
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "message": "E-mail enfileirado para envio",
  "estimatedSendTime": "immediate"
}
```

---

### `GET /api/relay/status/:id`
Consulta o status de um e-mail pelo UUID.

**Header:** `Authorization: Bearer {TOKEN}`

**Resposta 200:**
```json
{
  "id": "f47ac10b-...",
  "status": "sent",
  "to": "destinatario@example.com",
  "subject": "Assunto",
  "attempts": 1,
  "createdAt": "2026-06-18T10:30:00.000Z",
  "sentAt": "2026-06-18T10:30:05.000Z",
  "lastError": null,
  "nextRetryAt": null
}
```

Status possíveis: `pending` | `sent` | `failed` | `retrying`

---

### `GET /api/relay/health`
Health check público (sem autenticação).

**Resposta 200:**
```json
{
  "status": "ok",
  "timestamp": "2026-06-18T10:35:00.000Z",
  "database": "connected",
  "smtp": "configured",
  "metrics": { "sent": 42, "failed": 1 }
}
```

## Deploy com Docker

```bash
# Build e start
docker compose up -d --build

# Ver logs
docker compose logs -f relay-email

# Migração (executar na primeira vez ou após mudanças de schema)
docker compose exec relay-email npx prisma migrate deploy
```

## Deploy automático (GitHub Actions)

Configure os secrets no repositório GitHub:

| Secret        | Descrição                    |
|---------------|------------------------------|
| `VPS_HOST`    | IP ou hostname do servidor   |
| `VPS_USER`    | Usuário SSH                  |
| `VPS_SSH_KEY` | Chave privada SSH             |
| `VPS_PORT`    | Porta SSH (padrão: 22)       |

**Setup inicial no VPS:**
```bash
mkdir -p /opt/relay-email
cd /opt/relay-email
git clone https://github.com/SEU_ORG/relay-email.git .
cp .env.example .env
# Edite o .env com as credenciais de produção
docker compose up -d --build
docker compose exec relay-email npx prisma migrate deploy
```

Após isso, cada push na branch `main` dispara o deploy automático.

## Testes

```bash
npm test
```

## Lógica de retry

1. E-mail enfileirado → status `pending`
2. Tentativa de envio imediata via `setImmediate`
3. Se falhar e tentativas < 3 → status `retrying`, agenda próxima tentativa em 5 minutos
4. Se falhar 3x → status `failed` (não tenta mais)
5. Worker polling a cada 60s para processar retries
6. Limpeza automática de logs com mais de 90 dias (diária)
