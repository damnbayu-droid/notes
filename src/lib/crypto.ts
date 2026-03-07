/**
 * Advanced Crypto Utility for Smart Notes
 * Uses Web Crypto API (AES-GCM 256-bit)
 */

const ITERATIONS = 100000;
const ALGO = 'AES-GCM';

/**
 * Derives a cryptographic key from a password and salt using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: new Uint8Array(salt),
            iterations: ITERATIONS,
            hash: 'SHA-256',
        },
        passwordKey,
        { name: ALGO, length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypts content with a password
 */
export async function encryptWithPassword(content: string, password: string): Promise<{ encrypted: string; salt: string }> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);
    const encoder = new TextEncoder();

    const encryptedBuffer = await crypto.subtle.encrypt(
        { name: ALGO, iv },
        key,
        encoder.encode(content)
    );

    // Combine IV + Encrypted Data
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);

    return {
        encrypted: btoa(String.fromCharCode(...combined)),
        salt: btoa(String.fromCharCode(...salt)),
    };
}

/**
 * Decrypts content with a password
 */
export async function decryptWithPassword(encryptedData: string, password: string, saltData: string): Promise<string> {
    const combined = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
    const salt = new Uint8Array(atob(saltData).split('').map(c => c.charCodeAt(0)));

    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    const key = await deriveKey(password, salt);

    try {
        const decryptedBuffer = await crypto.subtle.decrypt(
            { name: ALGO, iv },
            key,
            data
        );
        return new TextDecoder().decode(decryptedBuffer);
    } catch (e) {
        throw new Error('Incorrect password or corrupted data');
    }
}

/**
 * Generates a random E2EE key and encrypts content
 */
export async function encryptE2EE(content: string): Promise<{ encrypted: string; key: string }> {
    const rawKey = crypto.getRandomValues(new Uint8Array(32)); // 256-bit
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const key = await crypto.subtle.importKey(
        'raw',
        rawKey,
        ALGO,
        false,
        ['encrypt']
    );

    const encoder = new TextEncoder();
    const encryptedBuffer = await crypto.subtle.encrypt(
        { name: ALGO, iv },
        key,
        encoder.encode(content)
    );

    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);

    return {
        encrypted: btoa(String.fromCharCode(...combined)),
        key: btoa(String.fromCharCode(...rawKey)).replace(/\//g, '_').replace(/\+/g, '-').replace(/=/g, ''), // URL safe base64
    };
}

/**
 * Decrypts E2EE content using the key fragment from URL
 */
export async function decryptE2EE(encryptedData: string, urlSafeKey: string): Promise<string> {
    // Convert URL safe back to standard base64
    const base64 = urlSafeKey.replace(/-/g, '+').replace(/_/g, '/');
    const rawKey = new Uint8Array(atob(base64).split('').map(c => c.charCodeAt(0)));
    const combined = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));

    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const key = await crypto.subtle.importKey(
        'raw',
        rawKey,
        ALGO,
        false,
        ['decrypt']
    );

    try {
        const decryptedBuffer = await crypto.subtle.decrypt(
            { name: ALGO, iv },
            key,
            data
        );
        return new TextDecoder().decode(decryptedBuffer);
    } catch (e) {
        throw new Error('Decryption failed. The key might be invalid.');
    }
}
