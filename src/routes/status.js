'use strict';

const { Router } = require('express');
const logService = require('../services/logService');

const router = Router();

router.get('/:id', async (req, res, next) => {
  try {
    const emailLog = await logService.getEmailLog(req.params.id);

    if (!emailLog) {
      return res.status(404).json({ success: false, error: 'E-mail não encontrado', statusCode: 404 });
    }

    return res.status(200).json({
      id: emailLog.id,
      status: emailLog.status,
      to: emailLog.to,
      subject: emailLog.subject,
      attempts: emailLog.attempts,
      createdAt: emailLog.createdAt,
      sentAt: emailLog.sentAt,
      lastError: emailLog.lastError,
      nextRetryAt: emailLog.nextRetryAt,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
