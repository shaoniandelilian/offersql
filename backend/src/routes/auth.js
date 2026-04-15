const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { signToken, verifyToken } = require('../utils/auth');
const database = require('../services/database');
const emailService = require('../services/emailService');

const router = express.Router();

const PHONE_REGEX = /^1\d{10}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESET_CODE_LENGTH = 6;
const RESET_CODE_TTL_MS = 5 * 60 * 1000;
const RESET_CODE_RESEND_COOLDOWN_MS = 60 * 1000;
const RESET_CODE_MAX_ATTEMPTS = 5;
const RESET_CODE_WINDOW_MS = 10 * 60 * 1000;
const RESET_CODE_MAX_EMAIL_REQUESTS = 5;
const RESET_CODE_MAX_IP_REQUESTS = 20;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizePhone(phone) {
  return String(phone || '').trim();
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

async function ensureEnvAdminUser() {
  const username = process.env.AUTH_USERNAME;
  const password = process.env.AUTH_PASSWORD;

  if (!username || !password) return null;

  let user = await database.findAuthUserByUsername(username);
  if (user) return user;

  const passwordHash = await bcrypt.hash(password, 10);
  const userId = await database.createAuthUser({
    username,
    passwordHash,
    role: 'ADMIN',
    plan: 'PRO',
  });
  user = await database.findAuthUserById(userId);
  return user;
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
  const { phone, password, email } = req.body || {};

  if (!phone || !password || !email) {
    return res.status(400).json({
      success: false,
      error: '手机号、邮箱和密码不能为空',
    });
  }

  const normalizedPhone = normalizePhone(phone);
  if (!PHONE_REGEX.test(normalizedPhone)) {
    return res.status(400).json({
      success: false,
      error: '手机号格式不正确',
    });
  }

  if (String(password).length < 6) {
    return res.status(400).json({
      success: false,
      error: '密码长度至少 6 位',
    });
  }

  const normalizedEmail = normalizeEmail(email);
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return res.status(400).json({
      success: false,
      error: '邮箱格式不正确',
    });
  }

  const existedPhone = await database.findAuthUserByPhone(normalizedPhone);
  if (existedPhone) {
    return res.status(409).json({
      success: false,
      error: '手机号已注册',
    });
  }
  const existedByUsername = await database.findAuthUserByUsername(normalizedPhone);
  if (existedByUsername) {
    return res.status(409).json({
      success: false,
      error: '手机号已注册',
    });
  }
  const existedEmail = await database.findAuthUserByEmail(normalizedEmail);
  if (existedEmail) {
    return res.status(409).json({
      success: false,
      error: '邮箱已被绑定',
    });
  }

  const passwordHash = await bcrypt.hash(String(password), 10);
  const userId = await database.createAuthUserWithProfile({
    username: normalizedPhone,
    email: normalizedEmail,
    phone: normalizedPhone,
    passwordHash,
    role: 'USER',
    plan: 'FREE',
  });

  const user = await database.findAuthUserById(userId);
  const token = signToken(buildAuthPayload(user));

  return res.json({
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
  });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: '用户名和密码不能为空',
    });
  }

  await ensureEnvAdminUser();
  const account = String(username).trim();
  let user = await database.findAuthUserByUsername(account);
  if (!user && PHONE_REGEX.test(account)) {
    user = await database.findAuthUserByPhone(account);
  }

  if (!user || user.status !== 'ACTIVE') {
    return res.status(401).json({
      success: false,
      error: '用户名或密码错误',
    });
  }

  const matched = await bcrypt.compare(String(password), user.password_hash);
  if (!matched) {
    return res.status(401).json({
      success: false,
      error: '用户名或密码错误',
    });
  }

  const token = signToken(buildAuthPayload(user));
  return res.json({
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
  });
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
