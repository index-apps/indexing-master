const { google } = require('googleapis');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { url } = req.body;

  try {
    // Vercel-এর Environment Variable থেকে কী লোড করা
    const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;

    const auth = new google.auth.JWT(
      clientEmail,
      null,
      privateKey,
      ['https://www.googleapis.com/auth/indexing'],
      null
    );

    const indexing = google.indexing('v1');
    
    // গুগলকে ইনডেক্সিং রিকোয়েস্ট পাঠানো
    const response = await indexing.urlNotifications.publish({
      auth: auth,
      requestBody: {
        url: url,
        type: 'URL_UPDATED',
      },
    });

    // সফল হলে মেসেজ
    return res.status(200).json({ message: 'Success! Google notified.', data: response.data });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
