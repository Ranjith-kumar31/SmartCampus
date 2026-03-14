const jwt = require('jsonwebtoken');

/**
 * Middleware: Verify JWT token from Authorization header.
 * Sets req.decoded to the full JWT payload.
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expect: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.decoded = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ message: 'Invalid token. Access denied.' });
  }
};

/**
 * Middleware: Ensure the authenticated user has the 'admin' role.
 * Must be used AFTER verifyToken.
 */
const isAdmin = (req, res, next) => {
  const role = req.decoded?.user?.role;
  if (role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Admin access required.' });
  }
  next();
};

/**
 * Middleware: Ensure the authenticated user has the 'hod' role.
 * Must be used AFTER verifyToken.
 */
const isHOD = (req, res, next) => {
  const role = req.decoded?.user?.role;
  if (role !== 'hod') {
    return res.status(403).json({ message: 'Forbidden. HOD access required.' });
  }
  next();
};

/**
 * Middleware: Ensure the authenticated user has the 'club' role.
 * Must be used AFTER verifyToken.
 */
const isClub = (req, res, next) => {
  const role = req.decoded?.club?.role;
  if (role !== 'club') {
    return res.status(403).json({ message: 'Forbidden. Club access required.' });
  }
  next();
};

/**
 * Middleware: Ensure the authenticated user has the 'student' role.
 * Must be used AFTER verifyToken.
 */
const isStudent = (req, res, next) => {
  const role = req.decoded?.student?.role;
  if (role !== 'student') {
    return res.status(403).json({ message: 'Forbidden. Student access required.' });
  }
  next();
};

module.exports = { verifyToken, isAdmin, isHOD, isClub, isStudent };
