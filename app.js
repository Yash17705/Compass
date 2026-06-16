if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressErrors.js");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const { MongoStore } = require("connect-mongo");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const crypto = require("crypto");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/compass";
const PORT = process.env.PORT || 8080;

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));

// Input sanitization & security middlewares (Express 5 compatible)
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.params) mongoSanitize.sanitize(req.params);
  if (req.headers) mongoSanitize.sanitize(req.headers);
  if (req.query) mongoSanitize.sanitize(req.query);
  next();
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
app.use(limiter);

// Nonce generation middleware
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString("base64");
  next();
});

// Helmet with CSP config
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: [
          "'self'",
          "https://*.tile.openstreetmap.org",
          "https://unpkg.com",
        ],
        scriptSrc: [
          "'self'",
          "https://cdn.jsdelivr.net",
          "https://unpkg.com",
          (req, res) => `'nonce-${res.locals.nonce}'`,
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.jsdelivr.net",
          "https://fonts.googleapis.com",
          "https://unpkg.com",
          "https://cdnjs.cloudflare.com",
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https://res.cloudinary.com",
          "https://images.unsplash.com",
          "https://*.tile.openstreetmap.org",
          "https://unpkg.com",
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "https://cdnjs.cloudflare.com",
        ],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
  }),
);

app.set("trust proxy", 1);

const store = MongoStore.create({
  mongoUrl: MONGO_URL,
  crypto: {
    secret: process.env.SESSION_SECRET || "development_secret_change_me",
  },
  touchAfter: 24 * 3600,
});

store.on("error", (err) => {
  console.error("ERROR IN MONGO SESSION STORE:", err);
});

const sessionOptions = {
  store,
  secret: process.env.SESSION_SECRET || "development_secret_change_me",
  resave: false,
  saveUninitialized: false,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  },
};
app.get("/", (req, res) => {
  res.redirect("/listings");
});

app.use(session(sessionOptions));
app.use(flash());

// Custom CSRF Generation
app.use((req, res, next) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString("hex");
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
});

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  next();
});

// Custom CSRF Validation Middleware
const csrfProtection = (req, res, next) => {
  const safeMethods = ["GET", "HEAD", "OPTIONS"];
  if (safeMethods.includes(req.method)) {
    return next();
  }
  const token =
    req.body?._csrf || req.headers["x-csrf-token"] || req.headers["xsrf-token"];

  if (!token || token !== req.session.csrfToken) {
    return next(new ExpressError(403, "Forbidden: Invalid CSRF Token"));
  }
  next();
};
app.use(csrfProtection);

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

app.all("/{*splat}", (req, res, next) => {
  next(new ExpressError(404, "Page not found"));
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  console.error(err);
  let { statusCode = 500, message = "Something went wrong" } = err;

  if (req.get("Accept")?.includes("json")) {
    return res.status(statusCode).json({ success: false, error: message });
  }
  res.status(statusCode).render("error.ejs", { message });
});
const server = app.listen(PORT, () => {
  console.log(`server is listening to port ${PORT}`);
});

const shutdown = async () => {
  await mongoose.connection.close();
  server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
