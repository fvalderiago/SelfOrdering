
exports.isAdmin = (req, res, next) => {
  // assumes you store the logged‑in user in the session
  if (req.session?.user?.role === 'admin') return next();
  res.redirect('/login');
};

exports.isChef = (req, res, next) => {
  if (req.session?.user?.role === 'chef') return next();
  res.redirect('/login');
};