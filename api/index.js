const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  // CORS এবং Method চেক
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (!privateKey || !clientEmail) {
      return res.status(500).json({ error: "Environment variables missing on Vercel" });
    }

    // চাবির নিউ-লাইন ঠিক করা
    privateKey = privateKey.replace(/\\n/g, '\n');

    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 3600;

    const payload = {
      iss: clientEmail,
      sub: clientEmail,
      aud: "https://oauth2.googleapis.com/token",
      iat: iat,
      exp: exp,
      scope: "https://www.googleapis.com/auth/indexing"
    };

    const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });

    const oauthResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${token}`
    });

    const oauthData = await oauthResponse.json();
    
    if (!oauthResponse.ok) {
      return res.status(401).json({ error: "Auth Failed", details: oauthData });
    }

    const indexingResponse = await fetch('https://indexing.googleapis.com/v1/urlNotifications:publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${oauthData.access_token}`
      },
      body: JSON.stringify({ url, type: 'URL_UPDATED' })
    });

    const indexingData = await indexingResponse.json();
    return res.status(indexingResponse.status).json(indexingData);

  } catch (error) {
    // এররটি সরাসরি রেসপন্সে পাঠানো যাতে আমরা বুঝতে পারি কী সমস্যা
    return res.status(500).json({ error: error.message });
  }
};
