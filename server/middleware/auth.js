const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * JWT 认证中间件
 * 从 Authorization: Bearer <token> 或 x-token 头中提取
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || req.headers['x-token'];
  if (!authHeader) {
    return res.status(401).json({ code: 401, message: '未登录' });
  }

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ code: 401, message: '登录已过期，请重新登录' });
  }
}

module.exports = authMiddleware;
