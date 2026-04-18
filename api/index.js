import { google } from 'googleapis';

export default async function handler(req, res) {
  // শুধু POST রিকোয়েস্ট গ্রহণ করবে
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ message: 'URL is required' });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/indexing'],
    });

    const client = await auth.getClient();
    const indexing = google.indexing({ version: 'v1', auth: client });

    const result = await indexing.urlNotifications.publish({
      requestBody: {
        url: url,
        type: 'URL_UPDATED',
      },
    });

    res.status(200).json({ success: true, message: 'Index request sent!', data: result.data });
  } catch (error) {
    console.error('Indexing Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
