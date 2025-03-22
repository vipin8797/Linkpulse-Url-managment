const ShortUrl = require('../../models/shortUrlSchema');
const Analytics = require('../../models/analyticsSchema');
const Summary = require('../../models/summarySchema');

async function updateUserSummary(userId) {
  try {
    const shortUrls = await ShortUrl.find({ userId });
    const shortUrlIds = shortUrls.map(url => url._id);
    const analyticsDocs = await Analytics.find({ shortUrlId: { $in: shortUrlIds } });

    let totalClicks = 0, totalUniqueVisitors = 0, totalConversionRate = 0, totalTimeOnPage = 0, totalBounceRate = 0;
    const browsers = {}, devices = {}, os = {}, countries = {}, cities = {}, coordinates = {}, referrers = {}, ips = {};

    analyticsDocs.forEach(doc => {
      totalClicks += doc.totalClicks || 0;
      totalUniqueVisitors += doc.uniqueVisitors || 0;
      totalConversionRate += doc.conversionRate || 0;
      totalTimeOnPage += doc.avgTimeOnPage || 0;
      totalBounceRate += doc.bounceRate || 0;

      doc.userAgents.forEach(ua => {
        browsers[ua.browser] = (browsers[ua.browser] || 0) + 1;
        devices[ua.device] = (devices[ua.device] || 0) + 1;
        os[ua.os] = (os[ua.os] || 0) + 1;
      });

      doc.locationData.forEach(loc => {
        countries[loc.country] = (countries[loc.country] || 0) + 1;
        cities[loc.city] = (cities[loc.city] || 0) + 1;
        const coordKey = `${loc.lat},${loc.lon}`;
        coordinates[coordKey] = (coordinates[coordKey] || 0) + 1;
      });

      doc.referrers.forEach(ref => {
        referrers[ref] = (referrers[ref] || 0) + 1;
      });

      doc.ipAddresses.forEach(ip => {
        ips[ip] = (ips[ip] || 0) + 1;
      });
    });

    const summaryData = {
      userId,
      totalClicks,
      totalUniqueVisitors,
      avgConversionRate: analyticsDocs.length ? totalConversionRate / analyticsDocs.length : 0,
      avgTimeOnPage: analyticsDocs.length ? totalTimeOnPage / analyticsDocs.length : 0,
      avgBounceRate: analyticsDocs.length ? totalBounceRate / analyticsDocs.length : 0,
      totalShortUrls: shortUrls.length,
      lastUpdated: new Date(),
      userAgentsSummary: {
        browsers: Object.entries(browsers).map(([name, count]) => ({ name, count })),
        devices: Object.entries(devices).map(([name, count]) => ({ name, count })),
        os: Object.entries(os).map(([name, count]) => ({ name, count }))
      },
      locationSummary: {
        countries: Object.entries(countries).map(([name, count]) => ({ name, count })),
        cities: Object.entries(cities).map(([name, count]) => ({ name, count })),
        coordinates: Object.entries(coordinates).map(([key, count]) => {
          const [lat, lon] = key.split(',').map(Number);
          return { lat, lon, count };
        })
      },
      referrersSummary: Object.entries(referrers).map(([name, count]) => ({ name, count })),
      ipSummary: Object.entries(ips).slice(0, 10).map(([ip, count]) => ({ ip, count }))
    };

    await Summary.findOneAndUpdate(
      { userId },
      summaryData,
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error(`Error updating summary for user ${userId}:`, error);
  }
}

module.exports =  updateUserSummary ;