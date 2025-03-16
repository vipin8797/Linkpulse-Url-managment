
 if(process.env.NODE_ENV !== "pruduction"){
    require('dotenv').config()
}
    

// Requiring Dependencies
const express = require('express');
const cors = require("cors");
const path = require('path');
engine = require('ejs-mate')
const methodOverride = require('method-override');
const mongoose = require('mongoose');
const ExpressError = require('./utils/ExpressError');
const wrapAsync = require('./utils/wrapAsync');

const {ShortUrl,User,
    Summary,Analytics,} = require('./models/index');
//helper funcctions
const { generateUniqueShortUrl } = require('./utils/helperFunctions/randUrlGenerator');
const generateQRCode = require('./utils/helperFunctions/qrCodeGen');
const trackAnalytics = require('./middlewares/trackAnalytics'); //anlytics middlware
cookieParser = require('cookie-parser') // cooki parser
const session = require('express-session')//express-sessions
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const MongoStore = require("connect-mongo"); // Store sessions in MongoDB




// Using Dependencies
const app = express();
app.engine('ejs', engine);
app.set('view engine', 'ejs'); 
app.set('views', path.join(__dirname, 'views'));

app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public'))); 
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()) //cookie parser

//express-sessions.
const store = MongoStore.create({
    mongoUrl:process.env.MONGODB_URL,
    crypto:{
        secrete:process.env.SUPER_SECRET_KEY,
        touchAfter:24*3600,
    }
})
store.on("error",()=>{console.log("error in sessions",err)}); //getting error for sessions.
app.use(session({
    store,
    secret: process.env.SUPER_SECRET_KEY,
    resave: false,            // No need to save session if no change
    saveUninitialized: true,  // Save session even if it's new (but not modified)
    autoRemove: "interval", // Automatically remove expired sessions
    autoRemoveInterval: 10 ,// Remove expired sessions every 10 minutes
    cookie: {
        secure: false,        // for localhost, true for HTTPS
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,  // Expiry time (7 days)
        maxAge: 7 * 24 * 60 * 60 * 1000,  // Session max age (7 days)
        httpOnly: true,       // Can't be accessed via JavaScript (prevents XSS attacks)
    },
}));
         
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());            



async function main() {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        // console.log(`Connected to DB: ${DB}`);
    } catch (error) {
        console.error("DB Connection Failed:", error);
    }
}

//Routes******************************************************

//global middleware 
app.use((req, res, next) => {
    // console.log(req.cookies);
    // console.log("Session ID:", req.sessionID);
    
    
    //  console.log("Session Object:", req.session);
     // console.log("User Object:", req.user);
    //  console.log("User ID:", req.session?.passport?.userId || "Guest User"); // ✅ Safe check
     next();
 });






//get for index
app.get('/api/shortUrl',(req,res,next)=>{
    res.render('index/index.ejs');
  
});

app.get('/api/shortUrl/hello',(req,res,next)=>{
    res.send("helllow")
  
});




//post for index
app.post('/api/shortUrl',wrapAsync(async(req ,res,next)=>{
// console.log(req.body);
//   console.log("gettign req");

  const {
    originalUrl,
    customDomain,
    expirationDate,
    generateQR,
} = req.body.url;

const userId = req.session?.passport?.userId || null;
const sessionId = req.sessionID;


  const baseDomain = "LinkPulse.com";


   //if url not come
  if(!originalUrl) return next(new ExpressError(404,"originalUrl is required"));
 
  //shortUrl generation
  let shortUrl=null ;
if (customDomain) {
    shortUrl = generateUniqueShortUrl(customDomain);
} else {
    shortUrl = generateUniqueShortUrl(baseDomain);
}

//generating qr Code for shorted url
// console.log(generateQR);
let qrCode = null;
if(generateQR){
      qrCode = await generateQRCode(shortUrl);
}
// console.log(qrCode);



  //expiry date Parsing.
  let expiryDate = null;
    const durationMapping = {
        "1d": 1, "2d": 2, "3d": 3,
        "1w": 7, "2w": 14, "1m": 30
    };

    if (expirationDate && typeof expirationDate === "string") {
        const durationKey = expirationDate.trim();
        // console.log("Parsed Expiration Date:", durationKey);

        if (durationMapping[durationKey]) {
            expiryDate = new Date(Date.now() + durationMapping[durationKey] * 24 * 60 * 60 * 1000);
        }
    }

 //setting expiration data if use is logged in 
     //otherwise default set to 12 hourse
 //function to check if user is looged in or not
 const newExpiryDate = new Date(Date.now() + 12 * 60 * 60 * 1000);


  //saving newShortUrl
  const newShortUrl = new ShortUrl({
    originalUrl: originalUrl,
    shortUrl:shortUrl,
    qrCode:qrCode,
    userId:userId,
    sessionId:sessionId,
    expirationDate:newExpiryDate,
    isActive: true,
});
// console.log(newShortUrl);
 

 //saving newShortUrl
 await newShortUrl.save();
 
//    console.log("new: ", newShortUrl);
// //  //sendin response
 // res.send(`originalUrl: ${originalUrl} and newShortUrl:${shortUrl}`)
  res.redirect('/api/shortUrl');
 }
));





///All Shorted Links routes
app.get('/api/yourLinks', wrapAsync(async (req,res)=>{
     const sessionId = req.sessionID;
     const user = req.user || null ; 
//  console.log(sessionId);
const allUrls = await ShortUrl.find({sessionId:sessionId});
// console.log(allLinks);

res.render('index/allLinks.ejs',{allUrls});
}));



//Analytic route for single link
app.get('/api/analytics/:id', wrapAsync(async (req, res) => {
console.log("Getting request for analytics");
    const { id } = req.params;

    // Fetch analytics data based on the shortUrlId
    const analyticsData = await Analytics.findOne({ shortUrlId: id });
    
   
    // console.log(analyticData);
    res.render('index/analytics.ejs',{analyticsData})
}));




// //Redirect Route****************************
app.get("/:domain/:shortCode",trackAnalytics, async (req, res, next) => {
    // console.log("🔹 Incoming Request:", req.params);
    
    let { domain, shortCode } = req.params;

    // 🔍 Find the Short URL in MongoDB
    const shortUrl = await ShortUrl.findOne({ shortUrl: `https://${domain}/${shortCode}` });

    if (!shortUrl) {
        return res.status(404).send("❌ URL Not Found or Expired");
    }

    
    // console.log("✅ Redirecting to:", shortUrl.originalUrl);
    res.redirect(shortUrl.originalUrl);
});







//if upper path does not matches
app.all('/*',(req,res,next)=>{
    // next(new ExpressError(404,req.path))
    console.log("wrong route: ",req.path," ",req.method);
})





// Default Error Handling Middleware
app.use((err, req, res, next) => {
    const { status = 500, message = "Something went wrong" } = err;
    //to print error in console.  
    // console.error("Error Message:", err.message);
    // console.error("Error Type:", err.name);
    // console.log("App is not crashed..");
    // Render error.ejs and pass error details
    //res.stat  
    //  KL/us(status).render("listings/error.ejs", { status, message });

    console.log(err);
    // res.send(err.message)
});



//********************************************************* */
// Start Server
const port = process.env.PORT;
main().then(() => {
   
    app.listen(port, () => {
        console.log(`Listening at port ${port}`);
    });
});
