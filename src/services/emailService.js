'use strict';

const transporter = require('../config/smtp');
const env = require('../config/env');
const logService = require('./logService');
const logger = require('../utils/logger');

const metrics = { sent: 0, failed: 0 };

function getMetrics() {
  return { ...metrics };
}

async function sendEmail(emailLog) {
  const { id, to, from, subject, body, replyTo, attempts } = emailLog;

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      html: body,
      ...(replyTo ? { replyTo } : {}),
    });

    await logService.markAsSent(id);
    metrics.sent++;
    logger.info('E-mail enviado', { id, to, subject });
  } catch (err) {
    const currentAttempts = attempts + 1;
    logger.warn('Falha ao enviar e-mail', { id, attempt: currentAttempts, error: err.message });

    if (currentAttempts >= env.MAX_RETRY_ATTEMPTS) {
      await logService.markAsFailed(id, err.message);
      metrics.failed++;
      logger.error('E-mail marcado como falha permanente', { id });
    } else {
      const nextRetryAt = new Date(Date.now() + env.RETRY_DELAY_MS);
      await logService.markAsRetrying(id, err.message, nextRetryAt);
      logger.info('Retry agendado', { id, nextRetryAt });
    }
  }
}

async function processQueue() {
  try {
    const [pending, retrying] = await Promise.all([
      logService.getPendingEmails(),
      logService.getRetryableEmails(),
    ]);

    const queue = [...pending, ...retrying];
    if (queue.length > 0) {
      logger.debug('Processando fila', { count: queue.length });
    }

    for (const email of queue) {
      await sendEmail(email);
    }
  } catch (err) {
    logger.error('Erro ao processar fila', { error: err.message });
  }
}

function enqueueEmail(emailLog) {
  setImmediate(() => sendEmail(emailLog));
}

function startWorker() {
  processQueue();

  setInterval(processQueue, 60_000);

  // Limpeza diária de logs com mais de 90 dias
  setInterval(() => {
    logService.deleteOldLogs(90).then((r) => {
      if (r.count > 0) logger.info('Logs antigos removidos', { count: r.count });
    });
  }, 24 * 60 * 60 * 1000);

  logger.info('Worker de e-mail iniciado', { pollingInterval: '60s' });
}

module.exports = { enqueueEmail, startWorker, getMetrics };
