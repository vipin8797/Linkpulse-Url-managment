// Middleware to check if user is authenticated
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
      console.log("Logged in user detected"); // Debugging
      return next(); // Proceed to the next middleware/route handler
    }
    // User not logged in, redirect to Google auth
    console.log("User not logged in, redirecting to Google auth");
    return res.redirect('/auth/google'); // Break the flow after redirect
  }
  
  module.exports = isLoggedIn;