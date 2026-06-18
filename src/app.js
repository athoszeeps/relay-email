'use strict';

require('./config/env');

const express = require('express');
const rateLimit = require('express-rate-limit');
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const relayRouter = require('./routes/relay');
const statusRouter = require('./routes/status');
const healthRouter = require('./routes/health');
const emailService = require('./services/emailService');
const logger = require('./utils/logger');
const env = require('./config/env');

const app = express();

app.use(express.json({ limit: '512kb' }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  keyGenerator: (req) => req.headers['authorization'] || req.ip,
  message: { success: false, error: 'Limite de 100 requisições/minuto excedido', statusCode: 429 },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/relay', limiter);

// Health check público — não passa pelo authMiddleware
app.use('/api/relay/health', healthRouter);

// Rotas protegidas
app.use('/api/relay', authMiddleware);
app.use('/api/relay', relayRouter);
app.use('/api/relay/status', statusRouter);

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Rota não encontrada', statusCode: 404 });
});

app.use(errorHandler);

emailService.startWorker();

app.listen(env.PORT, () => {
  logger.info('Relay SMTP iniciado', { port: env.PORT, env: env.NODE_ENV });
});

module.exports = app;
