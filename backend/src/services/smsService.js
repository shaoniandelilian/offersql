const logger = require('../utils/logger');
const Dysmsapi20170525 = require('@alicloud/dysmsapi20170525');
const OpenApi = require('@alicloud/openapi-client');
const Util = require('@alicloud/tea-util');

class SmsService {
  constructor() {
    this.mode = String(process.env.SMS_MODE || 'mock').toLowerCase();
    this.providerUrl = process.env.SMS_PROVIDER_URL || '';
    this.providerToken = process.env.SMS_PROVIDER_TOKEN || '';
  }

  async sendResetCode({ phone, code }) {
    if (this.mode === 'mock') {
      logger.info(`[SMS-MOCK] 向 ${phone} 发送验证码: ${code}`);
      return {
        success: true,
        provider: 'mock',
        debugCode: code,
      };
    }

    if (this.mode === 'aliyun') {
      return this.sendViaAliyun({ phone, code });
    }

    if (!this.providerUrl) {
      throw new Error('SMS_PROVIDER_URL 未配置，无法发送短信');
    }

    const headers = {
      'Content-Type': 'application/json',
    };
    if (this.providerToken) {
      headers.Authorization = `Bearer ${this.providerToken}`;
    }

    const response = await fetch(this.providerUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        scene: 'password_reset',
        phone,
        code,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`短信发送失败: HTTP ${response.status} ${body}`);
    }

    return {
      success: true,
      provider: 'http',
    };
  }

  async sendViaAliyun({ phone, code }) {
    const accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID || '';
    const accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET || '';
    const signName = process.env.ALIYUN_SMS_SIGN_NAME || '';
    const templateCode = process.env.ALIYUN_SMS_TEMPLATE_CODE || '';
    const endpoint = process.env.ALIYUN_SMS_ENDPOINT || 'dysmsapi.aliyuncs.com';

    if (!accessKeyId || !accessKeySecret || !signName || !templateCode) {
      throw new Error('阿里云短信配置不完整，请检查 AccessKey/签名/模板参数');
    }

    const config = new OpenApi.Config({
      accessKeyId,
      accessKeySecret,
      endpoint,
    });
    const client = new Dysmsapi20170525(config);
    const request = new Dysmsapi20170525.SendSmsRequest({
      phoneNumbers: phone,
      signName,
      templateCode,
      templateParam: JSON.stringify({ code }),
    });
    const runtime = new Util.RuntimeOptions({});
    const response = await client.sendSmsWithOptions(request, runtime);

    const respCode = response?.body?.code || '';
    if (respCode !== 'OK') {
      const message = response?.body?.message || '未知错误';
      throw new Error(`阿里云短信发送失败: ${respCode} ${message}`);
    }

    logger.info(`[SMS-ALIYUN] 短信发送成功 phone=${phone} bizId=${response?.body?.bizId || ''}`);
    return {
      success: true,
      provider: 'aliyun',
      bizId: response?.body?.bizId || '',
    };
  }
}

module.exports = new SmsService();
