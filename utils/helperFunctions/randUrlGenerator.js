const crypto = require('crypto');

// Generate Unique Short URL
function generateUniqueShortUrl(customDomain) {
    const domain = parseDomain(customDomain); // ✅ Normalize domain

    if (!domain) return "https://LinkPulse.com"; // Invalid domain

    const shortId = generateNanoId(); // Generate unique ID

    return `https://${domain}/${shortId}`;
};



function parseDomain(url) {
    try {
        if (!url || typeof url !== "string" || url.trim() === "") return null;
        
        // Trim spaces
        url = url.trim();
        
        // If it's just a TLD or invalid structure, return null
        const invalidPatterns = [
            /^-/,                  // Leading hyphen
            /\.\./,                // Double dots
            /^www\.$/,             // Only "www."
            /^https?:\/{0,2}$/,    // Just "http://" or "https://"
            /^\.\w+$/,             // Just ".com"
            /^\w+\.$/,             // "example." (trailing dot)
            /^com$/,               // Only "com"
            /^-?\w+[\.-]\.$/       // Ends with a dot
        ];
        if (invalidPatterns.some(pattern => pattern.test(url))) {
            return "LinkPulse.com"; // Redirect for invalid domains
        }

        // Add https:// if missing
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = "https://" + url;
        }

        // Use URL API to parse
        let parsed;
        try {
            parsed = new URL(url);
        } catch (e) {
            return "LinkPulse.com"; // Invalid URL
        }

        // Get hostname
        let domain = parsed.hostname;

        // Remove leading/trailing hyphens
        domain = domain.replace(/^[-]+|[-]+$/g, "");

        // If still invalid, return fallback
        if (!domain || domain.length < 3) {
            return "LinkPulse.com";
        }

        return  domain;
    } catch (error) {
        return "LinkPulse.com"; // Handle unexpected errors
    }
}





// ✅ Generate a unique short ID
function generateNanoId() {
    const timestamp = Date.now().toString(36); // Base36 timestamp
    const randomPart = crypto.randomBytes(3).toString('base64url'); // 6-char random
    return timestamp + randomPart;
}



module.exports = generateUniqueShortUrl;