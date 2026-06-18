'use strict';

require('dotenv').config();

const required = ['DATABASE_URL', 'SMTP_PASSWORD', 'RELAY_AUTH_TOKEN'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${key}`);
  }
}

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001', 10),
  DATABASE_URL: process.env.DATABASE_URL,
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.office365.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || 'envios@zeeps.com.br',
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  RELAY_AUTH_TOKEN: process.env.RELAY_AUTH_TOKEN,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  ALLOWED_SENDERS: (process.env.ALLOWED_SENDERS || 'envios@zeeps.com.br')
    .split(',')
    .map((s) => s.trim()),
  MAX_BODY_LENGTH: 5000,
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 5 * 60 * 1000,
};
