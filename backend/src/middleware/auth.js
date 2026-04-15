const { verifyToken } = require('../utils/auth');
const database = require('../services/database');

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

module.exports = async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      success: false,
      error: '未登录或登录已过期',
    });
  }

  try {
    const decoded = verifyToken(token);
    if (decoded.userType === 'GUEST' || String(decoded.sub).startsWith('guest_')) {
      req.user = {
        id: decoded.sub,
        username: decoded.username || '游客',
        email: '',
        phone: '',
        role: 'GUEST',
        plan: 'FREE',
        libraryPermissions: [],
        userType: 'GUEST',
      };
      return next();
    }

    const dbUser = await database.findAuthUserById(decoded.sub);
    if (!dbUser || dbUser.status !== 'ACTIVE') {
      return res.status(401).json({
        success: false,
        error: '登录凭证已失效，请重新登录',
      });
    }

    req.user = {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email || '',
      phone: dbUser.phone || '',
      role: dbUser.role || 'USER',
      plan: dbUser.plan || 'FREE',
      libraryPermissions: parseLibraryPermissions(dbUser.library_permissions),
      userType: 'REGISTERED',
    };
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: '登录凭证无效，请重新登录',
    });
  }
};
