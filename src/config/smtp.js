'use strict';

const nodemailer = require('nodemailer');
const env = require('./env');

const transportConfig = {
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false,
  tls: { rejectUnauthorized: true },
};

if (env.SMTP_PASSWORD) {
  transportConfig.auth = { user: env.SMTP_USER, pass: env.SMTP_PASSWORD };
}

const transporter = nodemailer.createTransport(transportConfig);

module.exports = transporter;
