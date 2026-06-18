'use strict';

process.env.DATABASE_URL = 'sqlserver://localhost:1433;database=test';
process.env.SMTP_PASSWORD = 'test';
process.env.RELAY_AUTH_TOKEN = 'test-token';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateSendRequest } = require('../src/utils/validators');

const VALID = {
  to: 'cliente@example.com',
  from: 'envios@zeeps.com.br',
  subject: 'Assunto',
  body: 'Corpo do e-mail',
  replyTo: 'reply@zeeps.com.br',
};

test('aceita payload válido', () => {
  assert.deepEqual(validateSendRequest(VALID), { valid: true });
});

test('rejeita campo ausente', () => {
  const { to: _, ...rest } = VALID;
  const result = validateSendRequest(rest);
  assert.equal(result.valid, false);
  assert.match(result.error, /to/);
});

test('rejeita email inválido no campo to', () => {
  const result = validateSendRequest({ ...VALID, to: 'nao-e-email' });
  assert.equal(result.valid, false);
  assert.match(result.error, /to/);
});

test('rejeita email inválido no campo replyTo', () => {
  const result = validateSendRequest({ ...VALID, replyTo: 'invalido' });
  assert.equal(result.valid, false);
  assert.match(result.error, /replyTo/);
});

test('rejeita remetente não autorizado', () => {
  const result = validateSendRequest({ ...VALID, from: 'outro@example.com' });
  assert.equal(result.valid, false);
  assert.match(result.error, /autorizado/);
});

test('rejeita body acima de 5000 chars', () => {
  const result = validateSendRequest({ ...VALID, body: 'x'.repeat(5001) });
  assert.equal(result.valid, false);
  assert.match(result.error, /limite/);
});

test('aceita body exatamente com 5000 chars', () => {
  const result = validateSendRequest({ ...VALID, body: 'x'.repeat(5000) });
  assert.deepEqual(result, { valid: true });
});
