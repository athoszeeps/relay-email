'use strict';

const prisma = require('../config/database');

async function createEmailLog({ id, to, from, subject, body, replyTo }) {
  return prisma.emailLog.create({
    data: { id, to, from, subject, body, replyTo, status: 'pending', attempts: 0 },
  });
}

async function getEmailLog(id) {
  return prisma.emailLog.findUnique({ where: { id } });
}

async function markAsSent(id) {
  return prisma.emailLog.update({
    where: { id },
    data: { status: 'sent', sentAt: new Date(), lastError: null, nextRetryAt: null },
  });
}

async function markAsRetrying(id, errorMessage, nextRetryAt) {
  return prisma.emailLog.update({
    where: { id },
    data: {
      status: 'retrying',
      lastError: errorMessage,
      nextRetryAt,
      attempts: { increment: 1 },
    },
  });
}

async function markAsFailed(id, errorMessage) {
  return prisma.emailLog.update({
    where: { id },
    data: {
      status: 'failed',
      lastError: errorMessage,
      nextRetryAt: null,
      attempts: { increment: 1 },
    },
  });
}

async function getPendingEmails() {
  return prisma.emailLog.findMany({
    where: { status: 'pending' },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });
}

async function getRetryableEmails() {
  return prisma.emailLog.findMany({
    where: { status: 'retrying', nextRetryAt: { lte: new Date() } },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });
}

async function deleteOldLogs(daysOld = 90) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOld);
  return prisma.emailLog.deleteMany({
    where: {
      createdAt: { lt: cutoff },
      status: { in: ['sent', 'failed'] },
    },
  });
}

module.exports = {
  createEmailLog,
  getEmailLog,
  markAsSent,
  markAsRetrying,
  markAsFailed,
  getPendingEmails,
  getRetryableEmails,
  deleteOldLogs,
};
