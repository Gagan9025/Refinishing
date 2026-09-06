function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: 'Unauthorized access.' });
    }

    const userRole = req.user.role;

    // Admin has access to everything
    if (userRole === 'admin') {
      return next();
    }

    // Check if user role is included in allowedRoles
    if (allowedRoles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      error: `Access Denied: Your role '${userRole}' is not authorized to access this resource.`
    });
  };
}

module.exports = {
  requireRole
};
