const SESSION_SECRET = process.env.SESSION_SECRET || 'electrocotiza-prod-paraguay-secret-2026-secure-token-construlogica';

export interface SessionPayload {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  exp: number; // segundos Unix
}

export const SESSION_COOKIE_NAME = 'electrocotiza_session';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bufferToBase64Url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBuffer(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - (base64url.length % 4)) % 4);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getHmacKey(): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'raw',
    encoder.encode(SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Crea un token de sesión firmado con HMAC-SHA256 utilizando Web Crypto API (Edge & Node compatible)
 */
export async function createSessionToken(
  payload: Omit<SessionPayload, 'exp'>, 
  expiresInSeconds = 7 * 24 * 60 * 60 // 7 días de validez
): Promise<string> {
  const fullPayload: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };
  const data = bufferToBase64Url(encoder.encode(JSON.stringify(fullPayload)));
  const key = await getHmacKey();
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const signature = bufferToBase64Url(signatureBuffer);
  return `${data}.${signature}`;
}

/**
 * Verifica la validez y expiración del token firmado con HMAC-SHA256
 */
export async function verifySessionToken(token?: string | null): Promise<SessionPayload | null> {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, signature] = parts;

  try {
    const key = await getHmacKey();
    const sigBytes = base64UrlToBuffer(signature);
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes as unknown as BufferSource,
      encoder.encode(data)
    );

    if (!isValid) {
      return null;
    }

    const payloadJson = decoder.decode(base64UrlToBuffer(data));
    const payload: SessionPayload = JSON.parse(payloadJson);
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null; // Token expirado
    }

    return payload;
  } catch {
    return null;
  }
}
