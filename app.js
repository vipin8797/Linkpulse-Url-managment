
 if(process.env.NODE_ENV !== "pruduction"){
    require('dotenv').config()
}
    

// Requiring Dependencies
const winston = require("winston"); //to track/store logs
const logger = require('./middlewares/logger');
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
const updateUserSummary = require('./utils/helperFunctions/updateSummary');
const generateAndGetQRCodePath = require('./utils/helperFunctions/qrCodeGen');
const trackAnalytics = require('./middlewares/trackAnalytics'); //anlytics middlware
cookieParser = require('cookie-parser') // cooki parser
const session = require('express-session')//express-sessions
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const MongoStore = require("connect-mongo"); // Store sessions in MongoDB
const fs = require("fs"); //used by multer

const multer = require('multer');//requiring multer

const routes = require('./routes/routes');


// Using Dependencies
const app = express();
app.engine('ejs', engine);
app.set('view engine', 'ejs'); 
app.set('views', path.join(__dirname, 'views'));

app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use( express.static(path.join(__dirname, 'uploads')));

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()) //cookie parser
app.use("/uploads", express.static(path.join(__dirname, "utils", "uploads"))); // to serve qr code images file
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
// passport.use(new LocalStrategy(User.authenticate()));
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());            
// 🏆 Google Authentication
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback",
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

//Multer
// Multer setup for file uploads for updated qr image.
const uploadDir = path.join(__dirname, "utils", "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueId = req.params.id; // Use link ID for uniqueness
        cb(null, `qr_${uniqueId}.png`); // Overwrite existing QR code
    }
});
const upload = multer({ storage });




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
  console.log('Middleware res.locals.user:', res.locals.user);
  console.log(req.files); 
  next();
 });





//testing helllo route
 app.use('/api/shortUrl', routes);
//  app.use('/api/shortUrl',routes); //index get route 

 





// //get for index
// app.get('/api/shortUrl',(req,res,next)=>{
//     res.render('index/index.ejs');
  
// });





//post for index to save shorteurl
// app.post('/api/shortUrl',wrapAsync(async(req ,res,next)=>{
// // console.log(req.body);
// //   console.log("gettign req");

//   const {
//     originalUrl,
//     customDomain,
//     expirationDate,
//     generateQR,
// } = req.body.url;


// const userId = req.user ? req.user._id : null; // ✅ User logged-in hai ya nahi check karna
// const sessionId = req.sessionID;



//   const baseDomain = "LinkPulse.com";


//    //if url not come
//   if(!originalUrl) return next(new ExpressError(404,"originalUrl is required"));
 
//   //shortUrl generation
//   let shortUrl=null ;
// if (customDomain) {
//     shortUrl = generateUniqueShortUrl(customDomain);
// } else {
//     shortUrl = generateUniqueShortUrl(baseDomain);
// }

// //generating qr Code for shorted url
// // console.log(generateQR);
// // Handle QR code generation and storage
// // Handle QR code generation and storage
// // QR code generation and storage
// let qrCodePath = null;
// if (generateQR) {
//      qrCodePath= await generateAndGetQRCodePath(shortUrl);
// }

//   // ✅ Expiry Date Parsing (User ke diya gaya expiration format ko convert karna)
// let expiryDate = null;

// // Mapping kis format me user likh sakta hai aur kitne din honge
// const durationMapping = {
//     "1d": 1, "2d": 2, "3d": 3,  // Days
//     "1w": 7, "2w": 14,          // Weeks
//     "1m": 30                    // Month
// };

// // Agar user ne expiration date diya hai toh use parse karo
// if (expirationDate && typeof expirationDate === "string") {
//     const durationKey = expirationDate.trim(); // Extra spaces remove karo
    
//     // Agar valid format diya gaya hai toh expiry date calculate karo
//     if (durationMapping[durationKey]) {
//         expiryDate = new Date(Date.now() + durationMapping[durationKey] * 24 * 60 * 60 * 1000);
//     }
// }

// // ✅ Expiry date set karna based on login status
// let newExpiryDate = null;
// if (!userId) {
//     // ❌ Agar user logged-in nahi hai toh default 12 ghante ka expiry set karo
//     newExpiryDate = new Date(Date.now() + 12 * 60 * 60 * 1000); 
// } else {
//     // ✅ Agar user logged-in hai toh user ka set kiya gaya expiry lo
//     // ❗ Agar user ne kuch nahi diya toh 30 din ka default expiry set karo
//     newExpiryDate = expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
// }



//   //saving newShortUrl
//   const newShortUrl = new ShortUrl({
//     originalUrl: originalUrl,
//     shortUrl:shortUrl,
//     qrCode:qrCodePath,
//     userId:userId,
//     sessionId:userId ? undefined : sessionId,
//     expirationDate:newExpiryDate,
//     isActive: true,
// });

// // console.log(newShortUrl);
 

//  //saving newShortUrl
//  await newShortUrl.save();

//  // ✅ Ensure sessionId is properly removed if user is logged in
// if (userId) {
//     await ShortUrl.updateOne(
//         { _id: newShortUrl._id },
//         { $unset: { sessionId: "" } } // ✅ Remove sessionId completely
//     );
// }
 
//    //console.log("new: ", newShortUrl);
// //  //sendin response
//  // res.send(`originalUrl: ${originalUrl} and newShortUrl:${shortUrl}`)
// //   res.redirect('/api/shortUrl');
//   res.render('index/result.ejs',{newShortUrl,path});
// //   res.json({ success: true, shortUrl });
//  }
// ));







///All Shorted Links routes
app.get('/api/yourLinks', wrapAsync(async (req, res) => {
    const sessionId = req.sessionID;
    const user = req.user ? req.user._id : null;
    
    let allUrls = null; // Declare only once

    if (user) {
        allUrls = await ShortUrl.find({ userId : user }); // findById se find() use kiya kyunki multiple links ho sakte hain
    } else {
        allUrls = await ShortUrl.find({ sessionId: sessionId });
    }
//   console.log(allUrls);
    res.render('index/allLinks.ejs', { allUrls ,path});
}));


//edit get route
app.get('/api/yourLinks/:id',wrapAsync(async(req,res)=>{
    // console.log("gettin edit req.")
    const {id} = req.params;
    const shortedUrl = await ShortUrl.findById(id);
    // console.log(shortedUrl);
    res.render('index/edit.ejs',{shortedUrl});
}))




//Edit Shorted link route
app.put("/api/yourLinks/:id", wrapAsync(async (req, res, next) => {
     console.log("getting put edit req...",req.params.id);
     console.log(req.body);
        const { id } = req.params;
        const { originalUrl, customDomain, expirationDate } = req.body.url;
     
        if (!originalUrl) return next(new ExpressError(400, "Original URL is required"));
        
        let shortUrl =  generateUniqueShortUrl(customDomain);
        // console.log(customDomain);
        // console.log(shortUrl);
        
        const durationMapping = {
            "1d": 1, "2d": 2, "3d": 3,
            "1w": 7, "2w": 14, "1m": 30
        };
        
        let expiryDate = null;
        if (expirationDate && typeof expirationDate === "string") {
            const durationKey = expirationDate.trim();
            if (durationMapping[durationKey]) {
                expiryDate = new Date(Date.now() + durationMapping[durationKey] * 24 * 60 * 60 * 1000);
            }
        }

       //agar user ne expiry date ni di
        let newExpiryDate = null;
        if (!expiryDate) {
            newExpiryDate = new Date(Date.now() + 12 * 60 * 60 * 1000); 
        } else {
            newExpiryDate = expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        }
            
        
        const userId = req.user ? req.user._id : null;
       // const updatedShortUrl = await ShortUrl.findById(id);
        // console.log(updatedShortUrl);

        const updatedShortUrl = await ShortUrl.findByIdAndUpdate(id, {
            originalUrl,
            shortUrl,
            expirationDate: newExpiryDate,
            isActive: true
        }, { new: true });
        
        // console.log(updatedShortUrl);
        if (!updatedShortUrl) return next(new ExpressError(404, "Short URL not found"));
        
       res.redirect("/api/yourLinks");
   
 }));

//download route
app.get("/api/download", (req, res) => {
    const filePath = req.query.path; // Frontend se path aayega
    console.log("filePath: ",filePath);
    if (!filePath) {
        return res.status(400).send("File path is required.");
    }

    // Ensure safe access
    const uploadDir = path.join(__dirname, "utils", "uploads");
    const absolutePath = path.join(uploadDir, path.basename(filePath));
     console.log("Absolute Path: ",absolutePath)
    // File exist check
    if (!fs.existsSync(absolutePath)) {
        return res.status(404).send("File not found.");
    }

    // Send file for download
    res.download(absolutePath, "qr-code.png", (err) => {
        if (err) {
            console.error("Download error:", err);
            res.status(500).send("Error downloading file.");
        }
    });
});


 //get for QR edit
 app.get('/api/yourLinks/:id/qrCode', wrapAsync(async(req,res)=>{
   console.log("getting qr code get req");
    const {id} = req.params;
    const Url = await ShortUrl.findById(id);
    // console.log(shortedUrl.qrCode);
   //creating obj to send only necessary data on for ejs
   const shortedUrl ={
       _id: Url._id,
       shortUrl:Url.shortUrl,
       qrCode:Url.qrCode,
   }
   
   res.render('index/qrEdit.ejs',{shortedUrl,path});
     
 }))

// PUT Route for QR Code Edit Form
// PUT Route for QR Code Edit Form
// PUT route with deletion of old QR image
app.put("/api/yourLinks/:id/qr", upload.single("qrImage"), async (req, res) => {


    try {
        console.log(req.files);
        const shortedUrl = await ShortUrl.findById(req.params.id);
        if (!shortedUrl) {
            return res.status(404).send("Link not found");
        }

        if (!req.file || req.file.size === 0) {
            console.log("No valid QR image uploaded");
            return res.status(400).send("No QR image uploaded or file is empty");
        }

        const newQrPath = path.join(uploadDir, req.file.filename); // qr_<id>.svg
        const oldQrPath = shortedUrl.qrCode;

        if (!fs.existsSync(newQrPath)) {
            console.error("New QR code file not found after upload");
            return res.status(500).send("Failed to save new QR code");
        }

        shortedUrl.qrCode = newQrPath;
        await shortedUrl.save();
        console.log("Updated qrCode to:", newQrPath);

        if (oldQrPath && oldQrPath !== newQrPath && fs.existsSync(oldQrPath)) {
            try {
                fs.unlinkSync(oldQrPath);
                console.log(`Deleted old QR code: ${oldQrPath}`);
            } catch (err) {
                console.error(`Error deleting old QR code: ${err.message}`);
            }
        }

        res.redirect(`/api/yourLinks/${req.params.id}?t=${Date.now()}`);
    } catch (error) {
        console.error("Error updating QR code:", error);
        res.status(500).send("Server error");
    }
});





//Delete shorted link route
app.delete('/api/yourLinks/:id',wrapAsync(async(req,res)=>{
            const { id } = req.params;
            const deletedUrl = await ShortUrl.findByIdAndDelete(id);
            
            if (!deletedUrl) {
                return res.status(404).json({ error: "Short URL not found" });
            }
    
          res.redirect('/api/yourLinks'); // ✅ Redirect back to URLs page
}))
 



//Analytic route for single link
app.get('/api/analytics/:id', wrapAsync(async (req, res) => {
console.log("Getting request for analytics");
    const { id } = req.params;

    
    // Fetch analytics data based on the shortUrlId
    // const analyticsData = await Analytics.find({ shortUrlId: id });
    const analyticsData = await Analytics.findById("67d9a7b9640733baa14216ab");
    // console.log(analyticsData);
   const shortUrl = await ShortUrl.findById(analyticsData.shortUrlId);
    // console.log(analyticData);
     res.render('index/analytics.ejs',{analyticsData,shortUrl})
}));




//Summary Analytics route
  app.get("/api/summaryAnalytics/:id",wrapAsync(async(req,res)=>{
    const userId = req.user._id; // Assuming user is authenticated
    await updateUserSummary(userId); // Update before rendering
     const summaryData = await Summary.findOne({ userId });
    
    const currentUser = await User.findById(userId);
    if (!summaryData) {
      return res.status(404).send('Summary not found');
    }
    console.log(summaryData);
    res.render('index/summary.ejs', { summaryData, currentUser });

}))


















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
    logger.warn(`wrong route | Route: ${req.method} ${req.originalUrl}`);

    console.log("wrong route: ",req.path," ",req.method);
})





// Default Error Handling Middleware
app.use((err, req, res, next) => {
    const { status = 500, message = "Something went wrong" } = err;
    logger.error(
        `🚨 ERROR: ${err.message} | Status: ${err.status || 500} | Route: ${req.method} ${req.originalUrl} | IP: ${req.ip}`,
        { stack: err.stack }
      );
    // console.log(err);
    res.send("/api/shortUrl");
});



//********************************************************* */
// Start Server
const port = process.env.PORT;
main().then(() => {
   
    app.listen(port, () => {
        console.log(`Listening at port ${port}`);
    });
});
