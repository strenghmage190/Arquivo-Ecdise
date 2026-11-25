export interface EncryptedNotePayload {
  ciphertext: string;
  iv: string;
  salt: string;
}

function toBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function fromBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function deriveAesKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return window.crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt.buffer as ArrayBuffer, iterations: 50000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptNoteBody(
  plaintext: string,
  password: string
): Promise<EncryptedNotePayload | null> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) return null;
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(password, salt);
  const enc = new TextEncoder();
  const cipherBuf = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    enc.encode(plaintext)
  );
  return {
    ciphertext: toBase64(new Uint8Array(cipherBuf)),
    iv: toBase64(iv),
    salt: toBase64(salt),
  };
}

export async function decryptNoteBody(
  payload: EncryptedNotePayload,
  password: string
): Promise<string | null> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) return null;
  try {
    const salt = fromBase64(payload.salt);
    const iv = fromBase64(payload.iv);
    const cipher = fromBase64(payload.ciphertext);
    const key = await deriveAesKey(password, salt);
    const plainBuf = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
      key,
      cipher.buffer as ArrayBuffer
    );
    return new TextDecoder().decode(plainBuf);
  } catch {
    return null;
  }
}
