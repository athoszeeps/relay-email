'use strict';

const logger = require('../utils/logger');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  logger.error('Erro não tratado', {
    message: err.message,
    path: req.path,
    method: req.method,
  });

  const isProduction = process.env.NODE_ENV === 'production';
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    error: isProduction && statusCode === 500 ? 'Erro interno do servidor' : err.message,
    statusCode,
  });
}

module.exports = errorHandler;
