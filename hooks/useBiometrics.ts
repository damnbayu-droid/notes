import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export function useBiometrics() {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);

  // Check for platform authenticator support
  const checkSupport = useCallback(async () => {
    if (window.PublicKeyCredential) {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      setIsSupported(available);
      return available;
    }
    setIsSupported(false);
    return false;
  }, []);

  const authenticate = useCallback(async () => {
    if (!window.PublicKeyCredential) {
      throw new Error('Biometric Protocol Unsupported on this Node');
    }

    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (!available) {
      throw new Error('Platform Authenticator (FaceID/Fingerprint) Unavailable');
    }

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const options: CredentialRequestOptions = {
      publicKey: {
        challenge,
        timeout: 60000,
        userVerification: 'required',
        rpId: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
        allowCredentials: [] // Empty allows any platform authenticator
      }
    };

    try {
      // Note: In a real production app, we would verify the credential on the server.
      // For this hardening phase, we are establishing the hardware handshake.
      const credential = await navigator.credentials.get(options);
      return !!credential;
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        throw new Error('Biometric Access Denied by User');
      }
      throw err;
    }
  }, []);

  return {
    isSupported,
    checkSupport,
    authenticate
  };
}
