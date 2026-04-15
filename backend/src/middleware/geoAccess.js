const geoip = require('geoip-lite');
const logger = require('../utils/logger');

function normalizeIp(rawIp) {
  let ip = String(rawIp || '').trim();
  if (!ip) return '';
  if (ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }
  if (ip.startsWith('::ffff:')) {
    ip = ip.slice(7);
  }
  return ip;
}

function isPrivateOrLocalIp(ip) {
  if (!ip) return false;
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true;
  if (/^10\./.test(ip)) return true;
  if (/^192\.168\./.test(ip)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return true;
  if (/^169\.254\./.test(ip)) return true;
  if (/^fc[0-9a-f]{2}:/i.test(ip) || /^fd[0-9a-f]{2}:/i.test(ip)) return true;
  if (/^fe80:/i.test(ip)) return true;
  return false;
}

function getClientIp(req, trustProxy) {
  const forwarded = req.headers['x-forwarded-for'];
  if (trustProxy && forwarded) {
    return normalizeIp(forwarded);
  }
  return normalizeIp(req.ip || req.socket?.remoteAddress || '');
}

function createGeoAccessMiddleware() {
  const enabled = String(process.env.GEO_CN_ONLY_ENABLED || 'false').toLowerCase() === 'true';
  const allowUnknown = String(process.env.GEO_CN_ONLY_ALLOW_UNKNOWN || 'false').toLowerCase() === 'true';
  const trustProxy = String(process.env.TRUST_PROXY || 'false').toLowerCase() === 'true';
  const protectedPaths = String(
    process.env.GEO_CN_ONLY_PATHS || '/api/auth/login,/api/auth/guest-login'
  )
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return function geoAccessMiddleware(req, res, next) {
    if (!enabled) {
      return next();
    }
    if (!protectedPaths.includes(req.path)) {
      return next();
    }

    const clientIp = getClientIp(req, trustProxy);
    if (!clientIp || isPrivateOrLocalIp(clientIp)) {
      return next();
    }

    const geo = geoip.lookup(clientIp);
    const country = geo?.country || '';
    if (country === 'CN') {
      return next();
    }

    if (!country && allowUnknown) {
      return next();
    }

    logger.warn(`Geo access blocked: ip=${clientIp}, country=${country || 'UNKNOWN'}, path=${req.path}`);
    return res.status(403).json({
      success: false,
      error: '当前区域暂不支持访问',
    });
  };
}

module.exports = createGeoAccessMiddleware;
