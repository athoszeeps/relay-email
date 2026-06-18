'use strict';

const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const { validateSendRequest } = require('../utils/validators');
const logService = require('../services/logService');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

const router = Router();

router.post('/send', async (req, res, next) => {
  try {
    const validation = validateSendRequest(req.body);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.error, statusCode: 400 });
    }

    const { to, from, subject, body, replyTo } = req.body;
    const id = uuidv4();

    const emailLog = await logService.createEmailLog({ id, to, from, subject, body, replyTo });
    logger.info('E-mail enfileirado', { id, to, subject });

    emailService.enqueueEmail(emailLog);

    return res.status(202).json({
      success: true,
      id,
      message: 'E-mail enfileirado para envio',
      estimatedSendTime: 'immediate',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
