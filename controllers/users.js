const User = require("../models/user.js");

module.exports.renderSignupForm = (req, res) => {
  res.render("users/signup.ejs");
};

module.exports.signup = async (req, res, next) => {
  try {
    let { username, email, password } = req.body;

    // Password strength validation
    if (!password || password.length < 8) {
      throw new Error("Password must be at least 8 characters long.");
    }
    if (!/[A-Z]/.test(password)) {
      throw new Error("Password must contain at least one capital letter.");
    }
    if (!/[0-9]/.test(password)) {
      throw new Error("Password must contain at least one number.");
    }
    if (!/[@$!%*?&#]/.test(password)) {
      throw new Error("Password must contain at least one special character (e.g. @, $, !, %, *, ?, &, #).");
    }

    const newUser = new User({ email, username });
    const registeredUser = await User.register(newUser, password);

    req.login(registeredUser, (err) => {
      if (err) {
        return next(err);
      }
      req.flash("success", "Welcome to Compass");
      res.redirect("/listings");
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/signup");
  }
};

module.exports.renderLoginForm = (req, res) => {
  res.render("users/login.ejs");
};

module.exports.login = async (req, res) => {
  req.flash("success", "Welcome Back");
  let redirectUrl = res.locals.redirectUrl || "/listings";
  res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "you are logged out");
    res.redirect("/listings");
  });
};
