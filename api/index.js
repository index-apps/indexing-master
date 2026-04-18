const jwt = require('jsonwebtoken');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  try {
    // Vercel Environment Variables থেকে ডাটা নেওয়া
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

    // JWT টোকেন তৈরি (গুগলকে ভেরিফাই করার জন্য)
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

    // ১. গুগলের কাছ থেকে এক্সেস টোকেন নেওয়া
    const oauthResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${token}`
    });

    const oauthData = await oauthResponse.json();
    const accessToken = oauthData.access_token;

    // ২. গুগল ইনডেক্সিং এপিআই-তে রিকোয়েস্ট পাঠানো
    const indexingResponse = await fetch('https://indexing.googleapis.com/v1/urlNotifications:publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        url: url,
        type: 'URL_UPDATED'
      })
    });

    const indexingData = await indexingResponse.json();

    if (indexingResponse.ok) {
      return res.status(200).json({ message: 'Success! Google notified.', data: indexingData });
    } else {
      return res.status(indexingResponse.status).json({ error: indexingData.error.message });
    }

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
