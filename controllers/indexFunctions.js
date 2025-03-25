//Requiring dependencies
const path = require('path'); //path
const fs = require("fs"); //used by multer
//winston logger
const logger = require('../middlewares/logger.js');



//ExpressError
const ExpressError = require('../utils/ExpressError');
//models
const {ShortUrl,Analytics,Summary,User} = require('../models/index');
//helper functions
const { generateUniqueShortUrl, generateAndGetQRCodePath,
     } = require('../utils/helperFunctions/index');

     //since it rturns a promise is liye direct import kar re hai 
const updateUserSummary = require('../utils/helperFunctions/updateSummary.js');












//to render index page
async function getIndexFunction (req,res,next){
    res.render('index/index', {
        title: 'LinkPulse - URL Shortener',
        description: 'Shorten your URLs with LinkPulse - Fast, secure, and easy link management with click tracking.',
        keywords: 'LinkPulse, URL shortener, shorten links, link management, click tracking',
        url: 'http://localhost:8080/api/shortUrl',
        image: '/icons/icon2.png'
      });
}




//post to submit url and generate shorted url
async function postIndexFunction (req ,res,next){
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
    
    //   res.render('index/result.ejs',{newShortUrl,path});
    res.render('index/result', {
        // 🔥 Pehle se jo important data tha, usko bhi include kiya
        newShortUrl, 
        path,
    
        // ✅ Meta Info
        title: `LinkPulse - ${newShortUrl}`, 
        description: `Shortened URL ${newShortUrl} redirecting to ${originalUrl} - Powered by LinkPulse${expirationDate ? ' (Expires: ' + expirationDate.toLocaleDateString() + ')' : ''}`,
        keywords: `LinkPulse, short URL, ${originalUrl.split('/')[2]}, link shortening`,
    
    });
    
     }
    





//get function for all links
// async function getAllLinks (req, res) {
//     // console.log("got the req");
//     const sessionId = req.sessionID;
//     const user = req.user ? req.user._id : null;
    
//     let allUrls = null; // Declare only once

//     if (user) {
//         allUrls = await ShortUrl.find({ userId : user }); // findById se find() use kiya kyunki multiple links ho sakte hain
//     } else {
//         allUrls = await ShortUrl.find({ sessionId: sessionId });
//     }
//    console.log(allUrls);
//    allUrls.map((shortedUrl)=>{
//        if(shortedUrl){
//         shortedUrl.expirationDate == 
//        }
//    })
//     // res.render('index/allLinks.ejs', { allUrls ,path});
//     // res.render('index/allLinks', {
//     //     // 🔥 Pehle se jo important data tha, usko maintain kiya
//     //     allUrls, 
//     //     path, 
    
//     //     // ✅ Meta Info
//     //     title: 'LinkPulse - All Links',
//     //     description: 'View all your shortened URLs - LinkPulse',
//     //     keywords: 'LinkPulse, all links, link management',
//     //     url: 'http://localhost:8080/api/yourLinks',
//     //     image: '/icons/icon2.png',
    
//     //  }
//     // );
    
// }    
async function getAllLinks(req, res) {


    const sessionId = req.sessionID;
    const user = req.user ? req.user._id : null;
    const now = new Date();
    const limit = 20; // Fixed limit of 20 links
    const page = parseInt(req.query.page) || 1; // Pagination support
    const skip = (page - 1) * limit;
  
    
      // Base query with limit, skip, and sort
      const query = user 
        ? { userId: user }
        : { sessionId: sessionId };
  
      // Fetch links with optimization
      const allUrls = await ShortUrl.find(query)
        .limit(limit)
        .skip(skip)
        .sort({ createdAt: -1 }) // Newest first
        .lean(); // Plain JS objects - faster, less memory
  
      // Check and update expired links efficiently
      const expiredIds = allUrls
        .filter(link => link.expirationDate && link.expirationDate < now && link.isActive)
        .map(link => link._id);
  
      if (expiredIds.length > 0) {
        await ShortUrl.updateMany(
          { _id: { $in: expiredIds } },
          { $set: { isActive: false } }
        );
      }
  
      // Filter active links for rendering
      const activeLinks = allUrls.filter(link => link.isActive);
  
      // Optional: Log memory usage for monitoring
      // console.log('Memory:', process.memoryUsage().rss / 1024 / 1024, 'MB');
  
      // Render response
      res.render('index/allLinks', {
        allUrls: activeLinks,
        path,
        title: 'LinkPulse - All Links',
        description: 'View your shortened URLs with LinkPulse',
        keywords: 'LinkPulse, all links, link management',
        url: 'http://localhost:8080/api/yourLinks', // Update to domain later
        image: '/icons/icon2.png',
        currentPage: page,
        hasMore: activeLinks.length === limit // For "Load More" UI
      });
  
  }
  
 


//get edit function for a link
async function getEditLink(req,res){
    // console.log("gettin edit req.");
    const {id} = req.params;
    const shortedUrl = await ShortUrl.findById(id);
    if(!shortedUrl){
        return next(new ExpressError(404, "shorted url not found."))
    }
    // console.log(shortedUrl);
    // res.render('index/edit.ejs',{shortedUrl});
    res.render('index/edit', {
        // 🔥 Pehle se jo important data tha, usko maintain kiya
        shortedUrl, 
    
        // ✅ Meta Info
        title: `LinkPulse - Edit ${shortedUrl}`,
        description: `Edit your shortened URL ${shortedUrl} - LinkPulse`,
        keywords: `LinkPulse, edit URL, ${shortedUrl}, link management`,
        url: `http://localhost:8080/api/yourLinks/${id}`,
        image: '/icons/icon2.png',
    
    
    });
    
}






//put edit function for link
async function putEditLink (req, res, next)  {
    // console.log("getting put edit req...",req.params.id);
    // console.log(req.body);
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
       if (!updatedShortUrl)  next(new ExpressError(404, "Shorted URL not found"));
       
      res.redirect("/api/yourLinks");
  
}




//get edit qr  code
async function getEditQr(req,res){
//    console.log("getting qr code get req");
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
     
 }


 //put edit qr code
// async function putEditQr(req, res) {
 
//         // console.log("✅ Multer File Path:", req.file?.path);
//         // console.log("✅ Multer Destination:", req.file?.destination);
//         // console.log("✅ Multer Filename:", req.file?.filename);

//         const shortedUrl = await ShortUrl.findById(req.params.id);
//         if (!shortedUrl) {
//             return next(new ExpressError(404,"Link not found"))
//         }
            

//         if (!req.file || req.file.size === 0) {
//             // console.log("❌ No valid QR image uploaded");
//             return next(new ExpressError(404,"No QR image uploaded or file is empty"));
//         }
           

//         // ✅ Fix: Define newQrPath correctly
//         let newQrPath = path.join(req.file.destination, req.file.filename);
//         // console.log("🆕 Expected New QR Path:", newQrPath);

//         if (!fs.existsSync(newQrPath)) {
//             // console.error("❌ New QR code file not found after upload!");
//             // console.log("📂 Folder Contents:", fs.readdirSync(req.file.destination));
//             return next(new ExpressError(404,"Failed to save new QR code"));
//         }
           
            

//         shortedUrl.qrCode = newQrPath;
//         await shortedUrl.save();
//        //  console.log("✅ Updated qrCode to:", newQrPath);

//         res.redirect(`/api/yourLinks/${req.params.id}?t=${Date.now()}`);
    
// }
async function putEditQr(req, res, next) {
    
      const shortedUrl = await ShortUrl.findById(req.params.id);
      if (!shortedUrl) {
        return next(new ExpressError(404, "Link not found"));
      }
  
      if (!req.file || req.file.size === 0) {
        return next(new ExpressError(404, "No QR image uploaded or file is empty"));
      }
  
      // Define new QR code path
      const newQrPath = path.join(req.file.destination, req.file.filename);
  
      if (!fs.existsSync(newQrPath)) {
        return next(new ExpressError(404, "Failed to save new QR code"));
      }
  
      // Delete old QR code file if it exists
      const oldQrPath = shortedUrl.qrCode; // Previous QR code path
      if (oldQrPath && fs.existsSync(oldQrPath)) {
        try {
          fs.unlinkSync(oldQrPath); // Delete the old file
         // console.log(`Deleted old QR code: ${oldQrPath}`); // Optional log
          logger.info(`Deleted old QR code: ${oldQrPath}`)
           
        } catch (deleteErr) {
          //console.error(`Failed to delete old QR code: ${deleteErr.message}`);
          // Don't throw error—continue with new QR save
          logger.warn(`Failed to delete old QR code: ${deleteErr.message}`);
        }
      }
  
      // Update with new QR code path
      shortedUrl.qrCode = newQrPath;
      await shortedUrl.save();
  
      res.redirect(`/api/yourLinks/${req.params.id}?t=${Date.now()}`);
    
    }
  


//delete shorted Link
// async function deleteQr(req,res){
//     const { id } = req.params;
//     const deletedUrl = await ShortUrl.findByIdAndDelete(id);
    
//     if (!deletedUrl) {
//         return next(new ExpressError(404, "Short URL not found"));
//     }
        
      

//   res.redirect('/api/yourLinks'); // ✅ Redirect back to URLs page
// }
async function deleteQr(req, res, next) {
    
      const { id } = req.params;
      const deletedUrl = await ShortUrl.findByIdAndDelete(id);
  
      if (!deletedUrl) {
         next(new ExpressError(404, "Shorted URL not found"));
      }
  
      // Delete associated QR code file if it exists
      const qrCodePath = deletedUrl.qrCode;
      if (qrCodePath && fs.existsSync(qrCodePath)) {
        try {
          fs.unlinkSync(qrCodePath); // Synchronously delete the QR file
          
          logger.info(`Deleted QR code file: ${qrCodePath}`)
        } catch (deleteErr) {
            //console.error(`Failed to delete QR code file: ${deleteErr.message}`);
            logger.warn(`Failed to delete QR code file: ${deleteErr.message}`)
          // Continue even if file deletion fails—DB deletion is priority
        }
      }
  
      res.redirect('/api/yourLinks');
   
  }


//get analytics for single link
async function getAnalyticsasync (req, res)  {
     //console.log("Getting request for  single analytics");
        const { id } = req.params;
    
        
        // Fetch analytics data based on the shortUrlId
       //  const analyticsData = await Analytics.findById("67d9a7b9640733baa14216ab");
         const analyticsData = await Analytics.find({ shortUrlId: id });
        // console.log(analyticsData);
       const shortUrl = await ShortUrl.findById(analyticsData.shortUrlId);
        // console.log(analyticData);
         res.render('index/analytics.ejs',{analyticsData,shortUrl})
    }


//Summary Analytics
async function getSummaryasync(req,res){
    //  console.log("getting summary get req..");
    const userId = req.user._id; // Assuming user is authenticated
    await updateUserSummary(userId); // Update before rendering
     const summaryData = await Summary.findOne({ userId });
    
    const currentUser = await User.findById(userId);
    if (!summaryData) {
        return next(new ExpressError(404, 'Summary not found'));
    }
      
    // console.log(summaryData);
    res.render('index/summary.ejs', { summaryData, currentUser });

}




     module.exports = {
        getIndexFunction,
        postIndexFunction,
        getAllLinks,
        getEditLink,
        putEditLink,
        getEditQr,
        putEditQr,
        deleteQr,
        getAnalyticsasync,
        getSummaryasync
    };