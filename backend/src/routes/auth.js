const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { signToken, signTokenWithExpires, verifyToken } = require('../utils/auth');
const database = require('../services/database');
const emailService = require('../services/emailService');

const router = express.Router();

const PHONE_REGEX = /^1\d{10}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d~!@#$%^&*()_+\-=[\]{}|;:'",.<>/?]{8,20}$/;
const RESET_CODE_LENGTH = 6;
const RESET_CODE_TTL_MS = 5 * 60 * 1000;
const RESET_CODE_RESEND_COOLDOWN_MS = 60 * 1000;
const RESET_CODE_MAX_ATTEMPTS = 5;
const RESET_CODE_WINDOW_MS = 10 * 60 * 1000;
const RESET_CODE_MAX_EMAIL_REQUESTS = 5;
const RESET_CODE_MAX_IP_REQUESTS = 20;
const WECHAT_STATE_EXPIRES_IN = '5m';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizePhone(phone) {
  return String(phone || '').trim();
}

function normalizeUsername(username) {
  return String(username || '').trim();
}

function parseLibraryPermissions(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((x) => String(x).trim()).filter(Boolean);
  } catch (error) {
    return [];
  }
}

function buildAuthPayload(user) {
  return {
    sub: String(user.id),
    username: user.username,
    email: user.email || '',
    phone: user.phone || '',
    role: user.role || 'USER',
    plan: user.plan || 'FREE',
    libraryPermissions: parseLibraryPermissions(user.library_permissions),
    userType: 'REGISTERED',
  };
}

function buildAuthResponse(user, token) {
  return {
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email || '',
        phone: user.phone || '',
        role: user.role,
        plan: user.plan,
        libraryPermissions: parseLibraryPermissions(user.library_permissions),
        userType: 'REGISTERED',
      },
    },
  };
}

function getWechatConfig() {
  const appid = normalizeUsername(process.env.WECHAT_OPEN_APP_ID);
  const secret = normalizeUsername(process.env.WECHAT_OPEN_APP_SECRET);
  const callbackUrl = normalizeUsername(process.env.WECHAT_OPEN_CALLBACK_URL);
  const enabled = Boolean(appid && secret && callbackUrl);

  return {
    enabled,
    appid,
    secret,
    callbackUrl,
  };
}

function createWechatStateToken() {
  return signTokenWithExpires({ purpose: 'wechat-login-state' }, WECHAT_STATE_EXPIRES_IN);
}

function verifyWechatStateToken(state) {
  const decoded = verifyToken(String(state || ''));
  return decoded?.purpose === 'wechat-login-state';
}

function sanitizeWechatNickname(nickname) {
  const value = String(nickname || '').trim();
  if (!value) return '微信用户';
  return value.replace(/\s+/g, '').slice(0, 24) || '微信用户';
}

async function generateWechatUsername(nickname, openid) {
  const base = sanitizeWechatNickname(nickname);
  const suffix = String(openid || '').slice(-6) || crypto.randomUUID().slice(0, 6);
  const candidates = [
    `${base}_${suffix}`,
    `${base}_${suffix}${crypto.randomUUID().slice(0, 4)}`,
    `wechat_${suffix}${crypto.randomUUID().slice(0, 6)}`,
  ];

  for (const candidate of candidates) {
    const existed = await database.findAuthUserByUsername(candidate);
    if (!existed) {
      return candidate;
    }
  }
  return `wechat_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

function serializeForInlineScript(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function buildWechatLoginSuccessHtml({ token, user }) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>微信登录中</title>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif; background: #f5f7fb; color: #0f172a; }
    .wrap { min-height: 100vh; display: grid; place-items: center; padding: 24px; }
    .card { width: min(440px, 100%); background: #fff; border-radius: 20px; padding: 32px; box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08); text-align: center; }
    .spinner { width: 28px; height: 28px; margin: 0 auto 16px; border-radius: 50%; border: 3px solid rgba(13, 148, 136, 0.16); border-top-color: #0d9488; animation: spin 0.9s linear infinite; }
    .title { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
    .desc { font-size: 14px; line-height: 1.7; color: #475569; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="spinner"></div>
      <div class="title">微信登录成功</div>
      <div class="desc">正在写入登录状态并跳转到练习区...</div>
    </div>
  </div>
  <script>
    localStorage.setItem('auth_token', ${serializeForInlineScript(token)});
    localStorage.setItem('user', ${serializeForInlineScript(JSON.stringify(user))});
    localStorage.setItem('isLoggedIn', 'true');
    window.location.replace('/app');
  </script>
</body>
</html>`;
}

function buildWechatLoginErrorHtml(message) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>微信登录失败</title>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif; background: #f8fafc; color: #0f172a; }
    .wrap { min-height: 100vh; display: grid; place-items: center; padding: 24px; }
    .card { width: min(440px, 100%); background: #fff; border-radius: 20px; padding: 32px; box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08); text-align: center; }
    .title { font-size: 20px; font-weight: 700; margin-bottom: 8px; color: #be123c; }
    .desc { font-size: 14px; line-height: 1.7; color: #475569; margin-bottom: 20px; }
    .button { display: inline-flex; align-items: center; justify-content: center; min-width: 140px; height: 42px; border-radius: 999px; background: #0f766e; color: #fff; text-decoration: none; font-size: 14px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="title">微信登录失败</div>
      <div class="desc">${serializeForInlineScript(message).slice(1, -1)}</div>
      <a class="button" href="/login">返回登录页</a>
    </div>
  </div>
</body>
</html>`;
}

async function fetchWechatJson(url) {
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.errmsg || '微信接口请求失败');
  }
  if (data?.errcode) {
    throw new Error(data.errmsg || '微信接口返回失败');
  }
  return data;
}

async function ensureEnvAdminUser() {
  const password = String(process.env.AUTH_PASSWORD || '').trim();
  const configuredEmail = normalizeEmail(process.env.AUTH_ADMIN_EMAIL);
  const legacyUsername = normalizeUsername(process.env.AUTH_USERNAME);

  if (!configuredEmail || !EMAIL_REGEX.test(configuredEmail) || !password) return null;

  let user = await database.findAuthUserByEmail(configuredEmail);
  if (!user && legacyUsername && legacyUsername !== configuredEmail) {
    user = await database.findAuthUserByUsername(legacyUsername);
  }

  if (user) {
    const updates = {};
    if (user.username !== configuredEmail) {
      updates.username = configuredEmail;
    }
    if (user.email !== configuredEmail) {
      updates.email = configuredEmail;
    }
    if (Object.keys(updates).length > 0) {
      await database.updateAuthUserIdentityById(user.id, updates);
      user = await database.findAuthUserById(user.id);
    }
    return user;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const userId = await database.createAuthUserWithProfile({
    username: configuredEmail,
    email: configuredEmail,
    phone: null,
    passwordHash,
    role: 'ADMIN',
    plan: 'PRO',
  });
  return database.findAuthUserById(userId);
}

router.post('/guest-login', async (req, res) => {
  const guestId = `guest_${crypto.randomUUID()}`;
  const token = signToken({
    sub: guestId,
    username: '游客',
    role: 'GUEST',
    plan: 'FREE',
    libraryPermissions: [],
    userType: 'GUEST',
  });

  return res.json({
    success: true,
    data: {
      token,
      user: {
        id: guestId,
        username: '游客',
        role: 'GUEST',
        plan: 'FREE',
        libraryPermissions: [],
        userType: 'GUEST',
      },
    },
  });
});

router.post('/register', async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || '');

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: '邮箱和密码不能为空',
    });
  }

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({
      success: false,
      error: '邮箱格式不正确',
    });
  }

  if (!PASSWORD_REGEX.test(password)) {
    return res.status(400).json({
      success: false,
      error: '密码需 8-20 位，且包含字母和数字',
    });
  }

  const existedEmail = await database.findAuthUserByEmail(email);
  if (existedEmail) {
    return res.status(409).json({
      success: false,
      error: '邮箱已注册',
    });
  }

  const existedByUsername = await database.findAuthUserByUsername(email);
  if (existedByUsername) {
    return res.status(409).json({
      success: false,
      error: '邮箱已注册',
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const userId = await database.createAuthUserWithProfile({
    username: email,
    email,
    phone: null,
    passwordHash,
    role: 'USER',
    plan: 'FREE',
  });

  const user = await database.findAuthUserById(userId);
  const token = signToken(buildAuthPayload(user));
  return res.json(buildAuthResponse(user, token));
});

router.post('/login', async (req, res) => {
  const email = normalizeEmail(req.body?.email || req.body?.username);
  const password = String(req.body?.password || '');

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: '邮箱和密码不能为空',
    });
  }

  await ensureEnvAdminUser();

  let user = await database.findAuthUserByEmail(email);
  if (!user) {
    user = await database.findAuthUserByUsername(email);
  }
  if (!user && PHONE_REGEX.test(email)) {
    user = await database.findAuthUserByPhone(email);
  }

  if (!user || user.status !== 'ACTIVE') {
    return res.status(401).json({
      success: false,
      error: '邮箱或密码错误',
    });
  }

  const matched = await bcrypt.compare(password, user.password_hash);
  if (!matched) {
    return res.status(401).json({
      success: false,
      error: '邮箱或密码错误',
    });
  }

  const token = signToken(buildAuthPayload(user));
  return res.json(buildAuthResponse(user, token));
});

router.get('/wechat/config', async (req, res) => {
  const config = getWechatConfig();

  if (!config.enabled) {
    return res.json({
      success: true,
      data: {
        enabled: false,
        appid: '',
        callbackUrl: '',
        state: '',
      },
    });
  }

  return res.json({
    success: true,
    data: {
      enabled: true,
      appid: config.appid,
      callbackUrl: config.callbackUrl,
      state: createWechatStateToken(),
      scope: 'snsapi_login',
      selfRedirect: true,
    },
  });
});

router.get('/wechat/callback', async (req, res) => {
  const config = getWechatConfig();
  if (!config.enabled) {
    return res.type('html').send(buildWechatLoginErrorHtml('微信登录暂未配置'));
  }

  const code = normalizeUsername(req.query?.code);
  const state = normalizeUsername(req.query?.state);

  if (!code || !state) {
    return res.type('html').send(buildWechatLoginErrorHtml('缺少必要的微信登录参数'));
  }

  try {
    if (!verifyWechatStateToken(state)) {
      throw new Error('登录状态已失效，请重新扫码');
    }

    const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?${new URLSearchParams({
      appid: config.appid,
      secret: config.secret,
      code,
      grant_type: 'authorization_code',
    }).toString()}`;
    const tokenData = await fetchWechatJson(tokenUrl);

    const profileUrl = `https://api.weixin.qq.com/sns/userinfo?${new URLSearchParams({
      access_token: tokenData.access_token,
      openid: tokenData.openid,
      lang: 'zh_CN',
    }).toString()}`;
    const profile = await fetchWechatJson(profileUrl);

    let user = await database.findAuthUserByWechatOpenId(tokenData.openid);
    if (!user) {
      const username = await generateWechatUsername(profile.nickname, tokenData.openid);
      const passwordHash = await bcrypt.hash(crypto.randomUUID(), 10);
      const userId = await database.createAuthUserWithProfile({
        username,
        email: null,
        phone: null,
        wechatOpenId: tokenData.openid,
        wechatUnionId: tokenData.unionid || profile.unionid || null,
        wechatNickname: sanitizeWechatNickname(profile.nickname),
        wechatAvatarUrl: profile.headimgurl || null,
        passwordHash,
        role: 'USER',
        plan: 'FREE',
      });
      user = await database.findAuthUserById(userId);
    } else {
      await database.updateAuthUserIdentityById(user.id, {
        wechatUnionId: tokenData.unionid || profile.unionid || user.wechat_unionid || null,
        wechatNickname: sanitizeWechatNickname(profile.nickname),
        wechatAvatarUrl: profile.headimgurl || null,
      });
      user = await database.findAuthUserById(user.id);
    }

    const token = signToken(buildAuthPayload(user));
    return res.type('html').send(buildWechatLoginSuccessHtml({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email || '',
        phone: user.phone || '',
        role: user.role,
        plan: user.plan,
        libraryPermissions: parseLibraryPermissions(user.library_permissions),
        userType: 'REGISTERED',
      },
    }));
  } catch (error) {
    return res.type('html').send(buildWechatLoginErrorHtml(error.message || '微信登录失败'));
  }
});

router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      success: false,
      error: '未登录',
    });
  }

  try {
    const decoded = verifyToken(token);
    if (decoded.userType === 'GUEST' || String(decoded.sub).startsWith('guest_')) {
      return res.json({
        success: true,
        data: {
          id: decoded.sub,
          username: decoded.username || '游客',
          email: '',
          phone: '',
          role: 'GUEST',
          plan: 'FREE',
          libraryPermissions: [],
          userType: 'GUEST',
        },
      });
    }

    const user = await database.findAuthUserById(decoded.sub);
    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({
        success: false,
        error: '登录已失效，请重新登录',
      });
    }

    return res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email || '',
        phone: user.phone || '',
        role: user.role,
        plan: user.plan,
        libraryPermissions: parseLibraryPermissions(user.library_permissions),
        userType: 'REGISTERED',
      },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: '登录已过期，请重新登录',
    });
  }
});

router.post('/password-reset/send-code', async (req, res) => {
  const email = normalizeEmail(req.body?.email);

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({
      success: false,
      error: '邮箱格式不正确',
    });
  }

  try {
    const now = Date.now();
    const recentByEmail = await database.listRecentPasswordResetEmailCodesByEmail(email, 20);
    const recentEmailCount = recentByEmail.filter(
      (item) => now - new Date(item.created_at || item.createdAt).getTime() <= RESET_CODE_WINDOW_MS
    ).length;
    if (recentEmailCount >= RESET_CODE_MAX_EMAIL_REQUESTS) {
      return res.status(429).json({
        success: false,
        error: '请求过于频繁，请稍后再试',
      });
    }

    const requestIp = req.ip || '';
    const recentByIp = await database.listRecentPasswordResetEmailCodesByIp(requestIp, 50);
    const recentIpCount = recentByIp.filter(
      (item) => now - new Date(item.created_at || item.createdAt).getTime() <= RESET_CODE_WINDOW_MS
    ).length;
    if (recentIpCount >= RESET_CODE_MAX_IP_REQUESTS) {
      return res.status(429).json({
        success: false,
        error: '请求过于频繁，请稍后再试',
      });
    }

    const latestCode = await database.getLatestActivePasswordResetEmailCode(email);
    if (latestCode && now - new Date(latestCode.created_at || latestCode.createdAt).getTime() < RESET_CODE_RESEND_COOLDOWN_MS) {
      return res.status(429).json({
        success: false,
        error: '发送过于频繁，请稍后再试',
      });
    }

    const user = await database.findAuthUserByEmail(email);
    if (!user || user.status !== 'ACTIVE') {
      return res.json({
        success: true,
        message: '验证码已发送（如邮箱已注册）',
      });
    }

    const code = String(Math.floor(Math.random() * (10 ** RESET_CODE_LENGTH))).padStart(RESET_CODE_LENGTH, '0');
    const secret = process.env.RESET_CODE_SECRET || process.env.JWT_SECRET || 'dev-reset-secret';
    const codeHash = crypto.createHash('sha256').update(`${email}:${code}:${secret}`).digest('hex');
    const expiresAt = new Date(Date.now() + RESET_CODE_TTL_MS);

    await database.invalidateActivePasswordResetEmailCodes(email);
    await database.createPasswordResetEmailCode({
      email,
      codeHash,
      expiresAt,
      requestIp,
    });

    const emailResult = await emailService.sendResetCode({ email, code });

    const payload = {
      success: true,
      message: '验证码已发送（如邮箱已注册）',
    };
    if (process.env.NODE_ENV !== 'production' && emailResult?.debugCode) {
      payload.debugCode = emailResult.debugCode;
    }
    return res.json(payload);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: '发送验证码失败: ' + error.message,
    });
  }
});

router.post('/password-reset/confirm', async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const code = String(req.body?.code || '').trim();
  const newPassword = String(req.body?.newPassword || '');

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({
      success: false,
      error: '邮箱格式不正确',
    });
  }
  if (!/^\d{6}$/.test(code)) {
    return res.status(400).json({
      success: false,
      error: '验证码格式不正确',
    });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      error: '新密码长度至少 6 位',
    });
  }

  try {
    const latestCode = await database.getLatestActivePasswordResetEmailCode(email);
    if (!latestCode) {
      return res.status(400).json({
        success: false,
        error: '验证码无效或已过期',
      });
    }

    const now = Date.now();
    const expiresAt = new Date(latestCode.expires_at || latestCode.expiresAt).getTime();
    if (!Number.isFinite(expiresAt) || now > expiresAt) {
      await database.markPasswordResetEmailCodeUsed(latestCode.id);
      return res.status(400).json({
        success: false,
        error: '验证码无效或已过期',
      });
    }
    if (Number(latestCode.attempt_count || 0) >= RESET_CODE_MAX_ATTEMPTS) {
      await database.markPasswordResetEmailCodeUsed(latestCode.id);
      return res.status(400).json({
        success: false,
        error: '验证码错误次数过多，请重新获取',
      });
    }

    const secret = process.env.RESET_CODE_SECRET || process.env.JWT_SECRET || 'dev-reset-secret';
    const codeHash = crypto.createHash('sha256').update(`${email}:${code}:${secret}`).digest('hex');
    if (codeHash !== latestCode.code_hash) {
      await database.incrementPasswordResetEmailCodeAttempt(latestCode.id);
      return res.status(400).json({
        success: false,
        error: '验证码无效或已过期',
      });
    }

    const user = await database.findAuthUserByEmail(email);
    if (!user || user.status !== 'ACTIVE') {
      await database.markPasswordResetEmailCodeUsed(latestCode.id);
      return res.status(400).json({
        success: false,
        error: '验证码无效或已过期',
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await database.updateAuthUserPasswordHashById(user.id, passwordHash);
    await database.markPasswordResetEmailCodeUsed(latestCode.id);

    return res.json({
      success: true,
      message: '密码重置成功，请重新登录',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: '重置密码失败: ' + error.message,
    });
  }
});

module.exports = router;
