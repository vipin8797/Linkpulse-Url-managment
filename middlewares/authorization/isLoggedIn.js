// Middleware to check if user is authenticated
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
      return next(); // User logged in, proceed to route
    }
    // User not logged in, redirect to Google auth
    res.redirect('/auth/google');
  }

  module.exports = isLoggedIn;