'use strict';

const env = require('../config/env');

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Token de autenticação ausente',
      statusCode: 401,
    });
  }

  const token = authHeader.slice(7);

  if (token !== env.RELAY_AUTH_TOKEN) {
    return res.status(401).json({
      success: false,
      error: 'Token de autenticação inválido',
      statusCode: 401,
    });
  }

  next();
}

module.exports = authMiddleware;
