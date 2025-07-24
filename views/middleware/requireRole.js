// middleware/requireRole.js
module.exports = role => (req, res, next) =>
  req.isAuthenticated() && req.user.role === role
    ? next()
    : res.status(403).send('Forbidden');
