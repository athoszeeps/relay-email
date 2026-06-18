'use strict';

process.env.DATABASE_URL = 'sqlserver://localhost:1433;database=test';
process.env.SMTP_PASSWORD = 'test';
process.env.RELAY_AUTH_TOKEN = 'meu-token-seguro';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const authMiddleware = require('../src/middleware/auth');

function makeReq(authHeader) {
  return { headers: authHeader ? { authorization: authHeader } : {} };
}

function makeRes() {
  const res = { _status: null, _body: null };
  res.status = (code) => { res._status = code; return res; };
  res.json   = (data) => { res._body = data; };
  return res;
}

test('rejeita requisição sem header Authorization', () => {
  const res = makeRes();
  let called = false;
  authMiddleware(makeReq(undefined), res, () => { called = true; });
  assert.equal(res._status, 401);
  assert.equal(called, false);
});

test('rejeita header sem prefixo Bearer', () => {
  const res = makeRes();
  let called = false;
  authMiddleware(makeReq('meu-token-seguro'), res, () => { called = true; });
  assert.equal(res._status, 401);
  assert.equal(called, false);
});

test('rejeita token incorreto', () => {
  const res = makeRes();
  let called = false;
  authMiddleware(makeReq('Bearer token-errado'), res, () => { called = true; });
  assert.equal(res._status, 401);
  assert.equal(called, false);
});

test('aceita token correto e chama next()', () => {
  const res = makeRes();
  let called = false;
  authMiddleware(makeReq('Bearer meu-token-seguro'), res, () => { called = true; });
  assert.equal(called, true);
  assert.equal(res._status, null);
});
