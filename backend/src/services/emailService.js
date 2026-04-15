const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.mode = String(process.env.EMAIL_MODE || 'mock').toLowerCase();
    this.host = process.env.EMAIL_SMTP_HOST || 'smtp.qq.com';
    this.port = Number(process.env.EMAIL_SMTP_PORT || 465);
    this.secure = String(process.env.EMAIL_SMTP_SECURE || 'true').toLowerCase() === 'true';
    this.user = process.env.EMAIL_SMTP_USER || '';
    this.pass = process.env.EMAIL_SMTP_PASS || '';
    this.fromName = process.env.EMAIL_FROM_NAME || 'OfferSQL';
  }

  createTransporter() {
    if (!this.user || !this.pass) {
      throw new Error('邮箱 SMTP 账号或授权码未配置');
    }
    return nodemailer.createTransport({
      host: this.host,
      port: this.port,
      secure: this.secure,
      auth: {
        user: this.user,
        pass: this.pass,
      },
    });
  }

  async sendResetCode({ email, code }) {
    if (this.mode === 'mock') {
      logger.info(`[EMAIL-MOCK] 向 ${email} 发送验证码: ${code}`);
      return {
        success: true,
        provider: 'mock',
        debugCode: code,
      };
    }

    const transporter = this.createTransporter();
    const fromAddress = this.user;
    const result = await transporter.sendMail({
      from: `"${this.fromName}" <${fromAddress}>`,
      to: email,
      subject: '【OfferSQL】找回密码验证码',
      text: `您正在重置 OfferSQL 密码，验证码为 ${code}，5 分钟内有效。`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.7;color:#111827;">
          <h2 style="margin:0 0 12px;">OfferSQL 验证码</h2>
          <p>您正在重置密码，本次验证码是：</p>
          <p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:8px 0;color:#0f766e;">${code}</p>
          <p>验证码 5 分钟内有效，请勿泄露给他人。</p>
        </div>
      `,
    });

    logger.info(`[EMAIL-SMTP] 邮件发送成功 to=${email} messageId=${result.messageId || ''}`);
    return {
      success: true,
      provider: 'smtp',
      messageId: result.messageId || '',
    };
  }
}

module.exports = new EmailService();
