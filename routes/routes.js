//Requiring Dependencies
const express = require('express');
const router = express.Router();

//wrapAsync
const ExpressError = require('../utils/ExpressError');
const wrapAsync = require('../utils/wrapAsync');

//models
const {ShortUrl,User,
    Summary,Analytics,} = require('../models/index');

//helper functions 
const { generateUniqueShortUrl, generateAndGetQRCodePath,updateUserSummary } = require('../utils/helperFunctions/randUrlGenerator');

//post route




//testing route
router.get('/',(req,res,next)=>{
    res.render('index/index.ejs');
  
});


//post Index Route for url saving.
router.post('/',wrapAsync(async(req ,res,next)=>{
    // console.log(req.body);
    //   console.log("gettign req");
    
      const {
        originalUrl,
        customDomain,
        expirationDate,
        generateQR,
    } = req.body.url;
    
    
    const userId = req.user ? req.user._id : null; // ✅ User logged-in hai ya nahi check karna
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
    // Handle QR code generation and storage
    // Handle QR code generation and storage
    // QR code generation and storage
    let qrCodePath = null;
    if (generateQR) {
         qrCodePath= await generateAndGetQRCodePath(shortUrl);
    }
    
      // ✅ Expiry Date Parsing (User ke diya gaya expiration format ko convert karna)
    let expiryDate = null;
    
    // Mapping kis format me user likh sakta hai aur kitne din honge
    const durationMapping = {
        "1d": 1, "2d": 2, "3d": 3,  // Days
        "1w": 7, "2w": 14,          // Weeks
        "1m": 30                    // Month
    };
    
    // Agar user ne expiration date diya hai toh use parse karo
    if (expirationDate && typeof expirationDate === "string") {
        const durationKey = expirationDate.trim(); // Extra spaces remove karo
        
        // Agar valid format diya gaya hai toh expiry date calculate karo
        if (durationMapping[durationKey]) {
            expiryDate = new Date(Date.now() + durationMapping[durationKey] * 24 * 60 * 60 * 1000);
        }
    }
    
    // ✅ Expiry date set karna based on login status
    let newExpiryDate = null;
    if (!userId) {
        // ❌ Agar user logged-in nahi hai toh default 12 ghante ka expiry set karo
        newExpiryDate = new Date(Date.now() + 12 * 60 * 60 * 1000); 
    } else {
        // ✅ Agar user logged-in hai toh user ka set kiya gaya expiry lo
        // ❗ Agar user ne kuch nahi diya toh 30 din ka default expiry set karo
        newExpiryDate = expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
    
    
    
      //saving newShortUrl
      const newShortUrl = new ShortUrl({
        originalUrl: originalUrl,
        shortUrl:shortUrl,
        qrCode:qrCodePath,
        userId:userId,
        sessionId:userId ? undefined : sessionId,
        expirationDate:newExpiryDate,
        isActive: true,
    });
    
    // console.log(newShortUrl);
     
    
     //saving newShortUrl
     await newShortUrl.save();
    
     // ✅ Ensure sessionId is properly removed if user is logged in
    if (userId) {
        await ShortUrl.updateOne(
            { _id: newShortUrl._id },
            { $unset: { sessionId: "" } } // ✅ Remove sessionId completely
        );
    }
     
       //console.log("new: ", newShortUrl);
    //  //sendin response
     // res.send(`originalUrl: ${originalUrl} and newShortUrl:${shortUrl}`)
    //   res.redirect('/api/shortUrl');
      res.render('index/result.ejs',{newShortUrl,path});
    //   res.json({ success: true, shortUrl });
     }
    ))




module.exports = router;