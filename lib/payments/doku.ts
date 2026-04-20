import crypto from 'crypto';

export interface DokuConfig {
    clientId: string;
    secretKey: string;
    apiUrl: string;
    isProduction: boolean;
}

export const getDokuConfig = (): DokuConfig => {
    return {
        clientId: process.env.DOKU_CLIENT_ID || '',
        secretKey: process.env.DOKU_SECRET_KEY || '',
        apiUrl: process.env.DOKU_API_URL || 'https://api.doku.com',
        isProduction: process.env.NEXT_PUBLIC_DOKU_IS_PRODUCTION === 'true',
    };
};

export function generateDigest(body: any): string {
    const jsonBody = JSON.stringify(body);
    const hash = crypto.createHash('sha256').update(jsonBody).digest();
    return hash.toString('base64');
}

export function generateSignature(
    clientId: string,
    requestId: string,
    timestamp: string,
    targetPath: string,
    digest: string,
    secretKey: string
): string {
    const rawString = 
        `Client-Id:${clientId}\n` +
        `Request-Id:${requestId}\n` +
        `Request-Timestamp:${timestamp}\n` +
        `Request-Target:${targetPath}\n` +
        `Digest:${digest}`;

    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(rawString);
    return `HMACSHA256=${hmac.digest('base64')}`;
}

export function generateWebhookSignature(
    clientId: string,
    timestamp: string,
    targetPath: string,
    digest: string,
    secretKey: string
): string {
      // Doku Webhook signature often follows a similar pattern but check notification headers
      const rawString = 
        `Client-Id:${clientId}\n` +
        `Request-Timestamp:${timestamp}\n` +
        `Request-Target:${targetPath}\n` +
        `Digest:${digest}`;

    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(rawString);
    return `HMACSHA256=${hmac.digest('base64')}`;
}
