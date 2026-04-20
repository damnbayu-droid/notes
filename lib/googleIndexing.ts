import { createSign } from 'crypto';

/**
 * Neural Indexing Bridge (v9.5.0)
 * Manual JWT implementation to bypass dependency restrictions.
 * Strictly triggers Google Indexing for 'is_discoverable' nodes.
 */
export async function notifyGoogleOfUpdate(url: string) {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    console.warn('Neural Indexing Bridge: Credentials missing. Skipping uplink.');
    return;
  }

  try {
    // Phase 1: Construct JWT Header & Payload
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const payload = Buffer.from(JSON.stringify({
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/indexing',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    })).toString('base64url');

    // Phase 2: Sign JWT (Neural RSA Handshake)
    const sign = createSign('RSA-SHA256');
    sign.update(`${header}.${payload}`);
    sign.end();
    const signature = sign.sign(privateKey, 'base64url');
    const jwt = `${header}.${payload}.${signature}`;

    // Phase 3: Exchange JWT for Access Token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    });

    const tokenData = await tokenRes.json() as { access_token: string };
    if (!tokenData.access_token) throw new Error('Failed to synchronize neural token.');

    // Phase 4: Publish to Google Indexing API
    const publishRes = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenData.access_token}`
      },
      body: JSON.stringify({
        url: url,
        type: 'URL_UPDATED'
      })
    });

    const result = await publishRes.json();
    return result;
  } catch (error) {
    console.error('Neural Indexing Failure:', error);
    // Silent fail in production to prevent user-facing crashes
    return null;
  }
}
