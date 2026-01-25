// Lightweight helpers for hex <-> text and simple encoders used by CreateClueModal and UniversalDecoder
export const bytesToHex = (bytes: Uint8Array) => Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
export const hexToBytes = (hex: string) => {
  const cleaned = hex.replace(/[^0-9a-fA-F]/g, '');
  const out = new Uint8Array(Math.ceil(cleaned.length / 2));
  for (let i = 0; i < cleaned.length; i += 2) out[i / 2] = parseInt(cleaned.substr(i, 2), 16);
  return out;
};

export const textToUtf8Bytes = (s: string) => {
  try { return new TextEncoder().encode(s); } catch { return new Uint8Array([]); }
};

export const utf8BytesToText = (b: Uint8Array) => {
  try { return new TextDecoder().decode(b); } catch { return '' + String.fromCharCode(...Array.from(b)); }
};

export const textToHex = (s: string) => bytesToHex(textToUtf8Bytes(s));
export const hexToText = (hex: string) => utf8BytesToText(hexToBytes(hex));

export const xorEncodeHex = (text: string, key: string) => {
  const data = textToUtf8Bytes(text);
  const k = textToUtf8Bytes(key || '');
  if (k.length === 0) return textToHex(text);
  const out = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) out[i] = data[i] ^ k[i % k.length];
  return bytesToHex(out);
};

export const xorDecodeHex = (hex: string, key: string) => {
  const bytes = hexToBytes(hex);
  const k = textToUtf8Bytes(key || '');
  if (k.length === 0) return utf8BytesToText(bytes);
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) out[i] = bytes[i] ^ k[i % k.length];
  return utf8BytesToText(out);
};

// Simple Enigma-like transform (reciprocal). Works on A-Z / a-z; others pass through.
const A = 65;
export const simpleEnigmaTransform = (text: string, key: string) => {
  const rotorWires = [
    'EKMFLGDQVZNTOWYHXUSPAIBRCJ',
    'AJDKSIRUXBLHWTMCQGZNPYFVOE',
    'BDFHJLCPRTXVZNYEIWGAKMUSQO'
  ];
  const reflector = 'YRUHQSLDPXNGOKMIEBFZCWVJAT';
  const keyBytes = textToUtf8Bytes(key || '');
  const pos = [0,0,0];
  for (let i = 0; i < keyBytes.length; i++) pos[i % 3] = (pos[i % 3] + keyBytes[i]) % 26;

  const encodeChar = (ch: string) => {
    const code = ch.charCodeAt(0);
    const isUpper = code >= 65 && code <= 90;
    const isLower = code >= 97 && code <= 122;
    if (!isUpper && !isLower) return ch;
    const base = isUpper ? 65 : 97;
    let c = code - base;

    for (let r = 0; r < 3; r++) {
      const wiring = rotorWires[r];
      const idx = (c + pos[r]) % 26;
      const mapped = wiring.charCodeAt(idx) - A;
      c = (mapped - pos[r] + 26) % 26;
    }

    c = reflector.charCodeAt(c) - A;

    for (let r = 2; r >= 0; r--) {
      const wiring = rotorWires[r];
      const letter = String.fromCharCode(A + c);
      const idx = wiring.indexOf(letter);
      c = (idx - pos[r] + 26) % 26;
    }

    pos[0] = (pos[0] + 1) % 26;
    if (pos[0] === 0) { pos[1] = (pos[1] + 1) % 26; if (pos[1] === 0) pos[2] = (pos[2] + 1) % 26; }

    return String.fromCharCode(base + c);
  };

  let out = '';
  for (const ch of text) out += encodeChar(ch);
  return out;
};

export const enigmaEncodeHex = (text: string, key: string) => textToHex(simpleEnigmaTransform(text, key));
export const enigmaDecodeHex = (hex: string, key: string) => {
  const txt = hexToText(hex);
  return simpleEnigmaTransform(txt, key);
};
