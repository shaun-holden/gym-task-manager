const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, organizationId: true },
    });
    if (!dbUser) return res.status(401).json({ error: 'User not found.' });
    req.user = dbUser;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
