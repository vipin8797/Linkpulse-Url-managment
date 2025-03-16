const crypto = require('crypto');

// Generate Unique Short URL
module.exports.generateUniqueShortUrl = function (customDomain) {
    const domain = parseDomain(customDomain); // ✅ Normalize domain

    if (!domain) return null; // Invalid domain

    const shortId = generateNanoId(); // Generate unique ID

    return `https://${domain}/${shortId}`;
};

// ✅ Parse & Normalize Domain
function parseDomain(input) {
    if (!input) return null;

    // ✅ Remove "http://" or "https://" if present
    let domain = input.replace(/^https?:\/\//, "").trim();

    // ✅ Remove any trailing "/" if present
    domain = domain.replace(/\/$/, "");

    // ✅ Remove any extra whitespaces within the domain
    domain = domain.replace(/\s+/g, "");

    // ✅ Validate Correct Domain Format
    return isValidDomain(domain) ? domain : null;
}


// ✅ Validate domain format
function isValidDomain(domain) {
    return /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain);
}

// ✅ Generate a unique short ID
function generateNanoId() {
    const timestamp = Date.now().toString(36); // Base36 timestamp
    const randomPart = crypto.randomBytes(3).toString('base64url'); // 6-char random
    return timestamp + randomPart;
}

// // ✅ Example Usage:
// console.log(generateUniqueShortUrl("https://vipin.in"));  // ✅ https://vipin.in/abc123
// console.log(generateUniqueShortUrl("http://mydomain.com"));  // ✅ https://mydomain.com/xyz456
// console.log(generateUniqueShortUrl("vip.in/"));  // ✅ https://vip.in/def789
// console.log(generateUniqueShortUrl("short.link/extra/path")); // ✅ https://short.link/ghi012
// console.log(generateUniqueShortUrl("invalid_domain")); // ❌ null
