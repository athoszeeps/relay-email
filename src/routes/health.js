'use strict';

const { Router } = require('express');
const prisma = require('../config/database');
const { getMetrics } = require('../services/emailService');

const router = Router();

router.get('/', async (req, res) => {
  let dbStatus = 'connected';
  try {
    await prisma.$queryRaw`SELECT 1 AS ok`;
  } catch {
    dbStatus = 'disconnected';
  }

  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    smtp: 'configured',
    metrics: getMetrics(),
  });
});

module.exports = router;
