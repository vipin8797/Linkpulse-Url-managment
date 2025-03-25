//Requiring Dependencies
const express = require('express');
const router = express.Router({ mergeParams: true });
//multer middleware
const upload = require('../middlewares/multer/multerMiddleware');
//wrapAsync
const wrapAsync = require('../utils/wrapAsync');

//Joi middlwares
const JoiValidateShortUrl1  = require('../middlewares/JoiValidateShortUrl1'); //for post route
const JoiValidateShortUrl2 = require('../middlewares/JoiValidateShortUrl2'); //for edit put route

//authentication middleware
const isLoggedIn = require('../middlewares/authorization/isLoggedIn');

//Controller function
const {getIndexFunction,postIndexFunction,
    getAllLinks,
    getEditLink,
    putEditLink,
    getEditQr,
    putEditQr,
    deleteQr,
    getAnalyticsasync,
    getSummaryasync
} = require('../controllers/indexController');




//get index route
router.get('/shortUrl',getIndexFunction);

//post route for shortUrl
router.post('/shortUrl',JoiValidateShortUrl1,wrapAsync(postIndexFunction));


//get for All Links
router.get('/yourLinks',wrapAsync(getAllLinks));

//get edit for link
router.get("/yourLinks/:id",wrapAsync(getEditLink));

// put edit route
router.put('/yourLinks/:id',JoiValidateShortUrl2,wrapAsync(putEditLink));

//get qr edit route
router.get("/yourLinks/:id/qrCode",wrapAsync(getEditQr));

// //put qr edit
router.put("/yourLinks/:id/qr",
      upload.single("qrImage"), // multer middleware
     wrapAsync(putEditQr)
);


//delete shorteUrl 
router.delete("/yourLinks/:id",wrapAsync(deleteQr));


//get for Summary Analytics
router.get("/summaryAnalytics",isLoggedIn,
    wrapAsync(getSummaryasync));


//get analytics for single link route
router.get("/analytics/:id",wrapAsync(getAnalyticsasync));











module.exports = router;