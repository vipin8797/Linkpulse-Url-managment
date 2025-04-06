
 if(process.env.NODE_ENV !== "pruduction"){
    require('dotenv').config()
}
    

// Requiring Dependencies
const logger = require('./middlewares/logger');

const express = require('express');
setupCronJobs = require('./cronJobs'); //cron job
const path = require('path');
engine = require('ejs-mate')
const methodOverride = require('method-override');
const mongoose = require('mongoose');
const ExpressError = require('./utils/ExpressError');
const wrapAsync = require('./utils/wrapAsync');
const flash = require('connect-flash'); // connect flash 

const {ShortUrl,User,
    Summary,Analytics,} = require('./models/index');
//helper funcctions
const trackAnalytics = require('./middlewares/trackAnalytics'); //anlytics middlware
cookieParser = require('cookie-parser') // cooki parser
const session = require('express-session')//express-sessions
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const MongoStore = require("connect-mongo"); // Store sessions in MongoDB

//Routes 
const linksRoutes = require('./routes/linkRoutes');

// Using Dependencies
const app = express();
// Setup cron jobs BEFORE error handler
setupCronJobs(app);

// Listen for app-level errors (e.g., from cron)
app.on('error', (err) => {
  logger.error(
    `🚨 CRON ERROR: ${err.message} | Status: ${err.status || 500}`,
    { stack: err.stack }
  );
  console.log('Cron error caught by app listener:', err);
  // Note: No res here, so can't send response
});

app.engine('ejs', engine);
app.set('view engine', 'ejs'); 

app.set('views', path.join(__dirname, 'views'));
app.set("subdomain offset", 2);//alow subomains.
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use( express.static(path.join(__dirname, 'uploads')));

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()) //cookie parser

app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); //path to serve qr code to ejs

//express-sessions.
const store = MongoStore.create({
    mongoUrl:process.env.MONGODB_URL,
    crypto:{
        secrete:process.env.SUPER_SECRET_KEY,
        touchAfter:24*3600,
    }
})
store.on("error",()=>{ return next(new ExpressError("User not authenticated!",err));}); //getting error for sessions.
app.use(session({
    store,
    secret: process.env.SUPER_SECRET_KEY,
    resave: false,            // No need to save session if no change
    saveUninitialized: true,  // Save session even if it's new (but not modified)
    autoRemove: "interval", // Automatically remove expired sessions
    autoRemoveInterval: 10 ,// Remove expired sessions every 10 minutes
    cookie: {
        secure: false,        //false for localhost, true for HTTPS
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,  // Expiry time (7 days)
        maxAge: 7 * 24 * 60 * 60 * 1000,  // Session max age (7 days)
        httpOnly: true,       // Can't be accessed via JavaScript (prevents XSS attacks)
    },
}));
// Connect-flash setup
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
            
// 🏆 Google Authentication
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://linkpulse.fun/auth/google/callback",
    passReqToCallback: true  // ✅ req object ko access karne ke liye
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });

      if (!user) {
        // ✅ Agar user exist nahi karta, to naya create karenge
        user = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails?.[0]?.value || null,
          sessionId: req.sessionID,  // ✅ Guest session ID store kar rahe hain
          photo: profile.photos[0].value,
        });
      }

      // ✅ Merging Guest Session Short URLs
      const guestUrls = await ShortUrl.countDocuments({ sessionId: req.sessionID });

      if (guestUrls > 0) {
        await ShortUrl.updateMany(
          { sessionId: req.sessionID },  // ✅ Un URLs ko dhundho jo guest session me bane the
          { $set: { userId: user._id }, $unset: { sessionId: "" } }  // ✅ Merge + Remove sessionId
        );
      }

      return done(null, user); // ✅ Authentication Success
    } catch (err) {
      return done(err, null); // ✅ Error Handling
    }
  }
));

  // 🔄 Serialize & Deserialize User (Supports Both Local & Google Auth)
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
  });



async function main() {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
         logger.info(`Server started on port ${process.env.PORT}`);
    } catch (error) {
        // console.error("DB Connection Failed:", error);
     logger.error("Failed to start server");
       
    }
}

//Routes******************************************************

//global middleware 
app.use((req, res, next) => {
  //flash messages.
 console.log("getting req at ",req.path); 
  res.locals.success_msg = req.flash('success'); // Success messages
  res.locals.error_msg = req.flash('error');  

    res.locals.user = req.user 
    ? { 
        ...req.user._doc || req.user, 
        _id: req.user._id, 
        isLoggedIn: true, 
        userImage: req.user.photo || req.user.userImage || '/icons/default_image.png' 
      } 
    : { 
        _id: null, 
        isLoggedIn: false, 
        userImage: '/icons/default_image.png' 
      };
//   console.log('Middleware res.locals.user:', res.locals.user);
//   console.log(req.files); 
  next();
 });






// 
// Middleware to extract subdomain
// app.use((req, res, next) => {
//   const fullDomain = req.hostname; // e.g., "mynewvideo.linkpulse.fun" or "localhost"
//   console.log("Full Domain:", fullDomain);

//   // Check if it's your domain
//   const baseDomain = process.env.DOMAIN || "linkpulse.fun"; // Use env var for flexibility
//   if (fullDomain.endsWith(baseDomain)) {
//     const subdomain = fullDomain.replace(`.${baseDomain}`, "").split(".")[0]; // Extract "mynewvideo"
//     req.subdomain = subdomain || null; // Store subdomain in req
//     console.log("Extracted Subdomain:", req.subdomain);
//   } else if (fullDomain.includes("localhost")) {
//     req.subdomain = "mynewvideo"; // Hardcode for local testing
//     console.log("Localhost detected, using default subdomain:", req.subdomain);
//   } else {
//     req.subdomain = null; // No valid subdomain
//     console.log("No valid subdomain detected");
//   }
//   next();
// });


// Subdomain middleware
app.use((req, res, next) => {
  const fullDomain = req.hostname;
  const baseDomain = "linkpulse.fun";
  if (fullDomain.endsWith(baseDomain)) {
    req.subdomain = fullDomain.replace(`.${baseDomain}`, "").split(".")[0];
    console.log("Subdomain:", req.subdomain);
  }
  next();
});

//ROutes************************************************







//index get route
//index post route
///All Shorted Links routes
//edit get route
// //Edit Shorted link route
//get to QR edit
// PUT route with deletion of old QR image
 app.use('/api', linksRoutes);
 
 

app.get('/shortUrl', (req, res) => {
  res.render('index/index', {
    title: 'LinkPulse - URL Shortener',
    description: 'Shorten your URLs with LinkPulse - Fast, secure, and easy link management with click tracking.',
    keywords: 'LinkPulse, URL shortener, shorten links, link management, click tracking',
    url: 'https://linkpulse.fun/shortUrl',
    image: 'https://linkpulse.fun/icons/icon2.png'
  });
});







//User Routes to login or signup
// Step 1: Redirect user to Google login page
app.get("/auth/google", passport.authenticate("google", { scope: ["profile"] }));

// Step 2: Google se redirect hone ke baad callback route
app.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/api/shortUrl" }),
    (req, res) => {
      res.redirect('/api/shortUrl'); // Successful login ke baad home page pe redirect
    }
  );

// Step 3: Logout route
app.get("/logout", (req, res) => {
    req.logout((err) => {
      if (err) return next(err);
    //   res.redirect("/");
    res.redirect('/api/shortUrl');
    });
  });



//Report Route
  app.post('/report', (req, res) => {
    const { reportUrl, reason } = req.body;
    // Logic to handle report (e.g., save to database, email admin)
    console.log(`Reported URL: ${reportUrl}, Reason: ${reason}`);
    res.redirect("/api/shortUrl");
  });

  //features
  app.get('/features', (req, res) => {
    res.render('index/features', {
      title: 'LinkPulse Features - Best Free URL Shortener',
      description: 'Explore all features of LinkPulse, the free URL shortener with custom domains, QR codes, and analytics.',
      keywords: 'URL shortener features, LinkPulse features, free URL shortener',
      url: 'https://linkpulse.fun/features',
      image: 'https://linkpulse.fun/icons/icon2.png'
    });
  });

  app.get('/blog', (req, res) => {
    res.render('index/blog.ejs', {
      title: 'LinkPulse Blog - URL Shortener Tips & Updates',
      description: 'Learn how to use a URL shortener with LinkPulse - Tips, tricks, and updates for free link shortening.',
      keywords: 'URL shortener, LinkPulse blog, shorten links, custom URL shortener',
      url: 'https://linkpulse.fun/blog',
      image: 'https://linkpulse.fun/icons/icon2.png'
    });
  });

  app.get('/about', (req, res) => {
    res.render('index/about', {
      title: 'About LinkPulse - Free URL Shortener',
      description: 'Learn about LinkPulse, your free URL shortener with custom domains, QR codes, and analytics.',
      keywords: 'about LinkPulse, URL shortener, free URL shortener, link shortening',
      url: 'https://linkpulse.fun/about',
      image: 'https://linkpulse.fun/icons/icon2.png'
    });
  });
 
  app.get('/contact', (req, res) => {
    res.render('index/contact', {
      title: 'Contact LinkPulse - Free URL Shortener Support',
      description: 'Get in touch with LinkPulse for support with our free URL shortener, custom domains, and analytics.',
      keywords: 'contact LinkPulse, URL shortener support, free URL shortener',
      url: 'https://linkpulse.fun/contact',
      image: 'https://linkpulse.fun/icons/icon2.png'
    });
  });


  app.get('/sitemap.xml', (req, res) => {
    res.header('Content-Type', 'application/xml');
    res.render('sitemap', { baseUrl: 'https://linkpulse.fun' });
  });


  app.get('/terms', (req, res) => {
    res.render('index/terms', {
      title: 'LinkPulse Terms of Service - URL Shortener',
      description: 'Read the Terms of Service for LinkPulse, your free URL shortener with custom domains and analytics.',
      keywords: 'URL shortener terms, LinkPulse terms, free URL shortener',
      url: 'https://linkpulse.fun/terms',
      image: 'https://linkpulse.fun/icons/icon2.png'
    });
  });
  
  app.get('/privacy', (req, res) => {
    res.render('index/privacy.ejs', {
      title: 'LinkPulse Privacy Policy - URL Shortener',
      description: 'Learn how LinkPulse protects your data with our free URL shortener service.',
      keywords: 'URL shortener privacy, LinkPulse privacy, free URL shortener',
      url: 'https://linkpulse.fun/privacy',
      image: 'https://linkpulse.fun/icons/icon2.png'
    });
  });
  
  app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send(`
      User-agent: *
      Disallow: /admin
      Disallow: /private
      Allow: /
      Sitemap: https://linkpulse.fun/sitemap.xml
    `);
  });





//Redirect Route****************************
app.get("/:shortCode", trackAnalytics,async (req, res, next) => {
//     console.log("🔹 Incoming Request:", req.params);
 console.log("getting requ for shorted url upper") ;
    
     let {  shortCode } = req.params;

    // 🔍 Find the Short URL in MongoDB
    const shortUrl = await ShortUrl.findOne({ shortUrl: `https://${req.subdomain}.${process.env.DOMAIN}/${shortCode}` });
  console.log(shortUrl);
  
    if (!shortUrl) {
      //return next(new ExpressError(404, "❌ URL Not Found "));
      req.flash('error', message="URL you are Searching For is not found!");
      res.render('index/404.ejs',{message});  
    } 
    if (!shortUrl.isActive) {
      return next(new ExpressError(404, "❌ URL Not  Expired"));
  }
    //updating lastAccessed of shorturl
    shortUrl.lastAccessedAt = Date.now();
    // console.log("✅ Redirecting to:", shortUrl.originalUrl);
    res.redirect(shortUrl.originalUrl);
 });











//if upper path does not matches
app.all("*",(req,res,next)=>{
    // next(new ExpressError(404,req.path))
 console.log("all case");
    logger.warn(`wrong route | Route: ${req.method} ${req.originalUrl}`);
    req.flash('error', message="Page Not Found! ");
    res.render("index/404.ejs",{message});
   //  console.log("wrong route: ",req.path," ",req.method);
})





// Default Error Handling Middleware
// app.use((err, req, res, next) => {
//     const { status = 500, message = "Something went wrong" } = err;
//     logger.error(
//         `🚨 ERROR: ${err.message} | Status: ${err.status || 500} | Route: ${req.method} ${req.originalUrl} | IP: ${req.ip}`,
//         { stack: err.stack }
//       );
//     console.log(err);
//     // res.send("Default error handler bhai..",err.message);
//     // res.redirect('/api/shortUrl');
// });

app.use((err, req, res, next) => {
  const { status = 500, message = "Something went wrong" } = err;
  if (req) {
    // Errors from routes
    logger.error(
      `🚨 ERROR: ${err.message} | Status: ${status} | Route: ${req.method} ${req.originalUrl} | IP: ${req.ip}`,
      { stack: err.stack }
    );
    res.status(status).json({ error: message });
  } else {
    // Errors from cron or other sources
    logger.error(
      `🚨 ERROR: ${err.message} | Status: ${status} | Source: Cron Job`,
      { stack: err.stack }
    );
    //console.log('Cron error processed by default handler:', err);
  }
  // req.flash('error', message=err.message);
 console.log(err);
});

//********************************************************* */
// Start Server
const port = process.env.PORT;
main().then(() => {
   
    app.listen(port, () => {
        console.log(`Listening at port ${port}`);
    });
});
