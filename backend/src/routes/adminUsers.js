const express = require('express');
const database = require('../services/database');

const router = express.Router();

const ALLOWED_PLANS = new Set(['FREE', 'PRO']);
const ALLOWED_LIBRARY_PERMISSIONS = new Set(['analysis_product', 'data_engineering']);

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

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: '仅管理员可访问',
    });
  }
  return next();
}

router.use(requireAdmin);

router.get('/users', async (req, res) => {
  try {
    const users = await database.listAuthUsers();
    return res.json({
      success: true,
      data: users.map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email || '',
        role: u.role,
        plan: u.plan,
        libraryPermissions: parseLibraryPermissions(u.library_permissions),
        status: u.status,
        createdAt: u.created_at,
      })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: '获取用户列表失败: ' + error.message,
    });
  }
});

router.patch('/users/:userId/plan', async (req, res) => {
  const userId = Number(req.params.userId);
  const { plan } = req.body || {};

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({
      success: false,
      error: '用户ID无效',
    });
  }

  const normalizedPlan = String(plan || '').toUpperCase();
  if (!ALLOWED_PLANS.has(normalizedPlan)) {
    return res.status(400).json({
      success: false,
      error: '套餐仅支持 FREE 或 PRO',
    });
  }

  try {
    const user = await database.findAuthUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在',
      });
    }

    await database.updateAuthUserPlan(userId, normalizedPlan);
    const updated = await database.findAuthUserById(userId);
    return res.json({
      success: true,
      data: {
        id: updated.id,
        username: updated.username,
        email: updated.email || '',
        role: updated.role,
        plan: updated.plan,
        libraryPermissions: parseLibraryPermissions(updated.library_permissions),
        status: updated.status,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: '更新套餐失败: ' + error.message,
    });
  }
});

router.patch('/users/:userId/library-permissions', async (req, res) => {
  const userId = Number(req.params.userId);
  const { libraryPermissions } = req.body || {};

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({
      success: false,
      error: '用户ID无效',
    });
  }

  if (!Array.isArray(libraryPermissions)) {
    return res.status(400).json({
      success: false,
      error: 'libraryPermissions 必须是数组',
    });
  }

  const normalizedPermissions = [...new Set(
    libraryPermissions.map((x) => String(x || '').trim()).filter(Boolean)
  )];
  const hasInvalid = normalizedPermissions.some((x) => !ALLOWED_LIBRARY_PERMISSIONS.has(x));
  if (hasInvalid) {
    return res.status(400).json({
      success: false,
      error: `仅支持权限: ${Array.from(ALLOWED_LIBRARY_PERMISSIONS).join(', ')}`,
    });
  }

  try {
    const user = await database.findAuthUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在',
      });
    }

    await database.updateAuthUserLibraryPermissions(userId, normalizedPermissions);
    const updated = await database.findAuthUserById(userId);
    return res.json({
      success: true,
      data: {
        id: updated.id,
        username: updated.username,
        email: updated.email || '',
        role: updated.role,
        plan: updated.plan,
        libraryPermissions: parseLibraryPermissions(updated.library_permissions),
        status: updated.status,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: '更新题库权限失败: ' + error.message,
    });
  }
});

module.exports = router;
