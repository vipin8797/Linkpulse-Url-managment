

const ExpressError = require('../utils/ExpressError');
const ShortUrl = require("../models/shortUrlSchema");
const Analytics = require("../models/analyticsSchema");
const useragent = require("useragent"); //browser and device
const requestIp = require("request-ip"); //ip 
const geoip = require("geoip-lite"); //geo locaiton

// ✅ Short URL Click Handler (Analytics + Redirect)
const trackAnalytics = async (req, res, next) => {
    try {
        let { domain, shortCode } = req.params;

        // 🔥 Step 1: Find the Short URL
        const shortUrl = await ShortUrl.findOne({ shortUrl: `https://${domain}/${shortCode}` });
        
        if (!shortUrl) {
          return next(new ExpressError(404,"Shorted URL not found"))
            
        }
            
        
        // 🔥 Step 2: Extract User-Agent Data
        const agent = useragent.parse(req.get("User-Agent"));
        const userAgent = {
            browser: agent.family || "Unknown",
            device: agent.device.family || "Unknown",
            os: agent.os.family || "Unknown"
        };
        
        // 🔥 Step 3: Get IP Address and Location
        const gip = requestIp.getClientIp(req);
        const geo = geoip.lookup(gip);

        const locationData = {
            country: geo?.country || "Unknown",
            city: geo?.city || "Unknown",
            region: geo?.region || "Unknown",
            lat: geo?.ll ? geo.ll[0] : null,
            lon: geo?.ll ? geo.ll[1] : null
        };
        
        // 🔥 Step 4: Get Referrer (User came from where?)
        const referrer = req.get("Referer") || "Direct";
        
        // 🔥 Step 5: Find or Create Analytics Entry
        let analytics = await Analytics.findOne({ shortUrlId: shortUrl._id });

        if (!analytics) {
            analytics = new Analytics({ shortUrlId: shortUrl._id });
        }

        // ✅ Step 6: Update Analytics Data
        analytics.totalClicks += 1; // Increase total click count
        
        // If it's a new unique visitor, update uniqueVisitors & store IP
        if (!analytics.ipAddresses.includes(gip)) {
            analytics.uniqueVisitors += 1;
            analytics.ipAddresses.push(gip);
        }

        // Save user-agent details
        analytics.userAgents.push(userAgent);
        
        // Save location details
        analytics.locationData.push(locationData);

        // Save referrer details
        analytics.referrers.push(referrer);

        // Save analytics data
        await analytics.save();
        // console.log(analytics);

        next(); // ✅ Move to the next middleware or controller
    } catch (error) {
        // console.error("Analytics Tracking Error:", error);
        // res.status(500).send("Server Error");
        return next(new ExpressError(500,error));
    }
};


module.exports = trackAnalytics;
