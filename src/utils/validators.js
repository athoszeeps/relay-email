'use strict';

const env = require('../config/env');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isEmail(value) {
  return typeof value === 'string' && EMAIL_RE.test(value);
}

function validateSendRequest(body) {
  const required = ['to', 'from', 'subject', 'body', 'replyTo'];

  for (const field of required) {
    if (body[field] == null || body[field] === '') {
      return { valid: false, error: `Campo '${field}' é obrigatório` };
    }
  }

  if (!isEmail(body.to)) {
    return { valid: false, error: "Campo 'to' deve ser um e-mail válido" };
  }

  if (!isEmail(body.from)) {
    return { valid: false, error: "Campo 'from' deve ser um e-mail válido" };
  }

  if (!env.ALLOWED_SENDERS.includes(body.from)) {
    return { valid: false, error: 'Remetente não autorizado' };
  }

  if (!isEmail(body.replyTo)) {
    return { valid: false, error: "Campo 'replyTo' deve ser um e-mail válido" };
  }

  if (body.body.length > env.MAX_BODY_LENGTH) {
    return {
      valid: false,
      error: `Corpo do e-mail excede o limite de ${env.MAX_BODY_LENGTH} caracteres`,
    };
  }

  return { valid: true };
}

module.exports = { isEmail, validateSendRequest };
