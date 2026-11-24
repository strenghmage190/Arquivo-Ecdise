// Lightweight cipher utilities used by decoder tools and TabCipher embedded cipher
import { simpleEnigmaTransform } from './hexEncoders';

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const MORSE_DECODE: Record<string, string> = {
  '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E',
  '..-.': 'F', '--.': 'G', '....': 'H', '..': 'I', '.---': 'J',
  '-.-': 'K', '.-..': 'L', '--': 'M', '-.': 'N', '---': 'O',
  '.--.': 'P', '--.-': 'Q', '.-.': 'R', '...': 'S', '-': 'T',
  '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X', '-.--': 'Y',
  '--..': 'Z',
  '-----': '0', '.----': '1', '..---': '2', '...--': '3', '....-': '4',
  '.....': '5', '-....': '6', '--...': '7', '---..': '8', '----.': '9',
  '/': ' ',
};

const MORSE_ENCODE: Record<string, string> = Object.entries(MORSE_DECODE).reduce(
  (acc, [code, ch]) => {
    acc[ch] = code;
    return acc;
  },
  {} as Record<string, string>
);

const toBytes = (input: string): number[] => {
  if (typeof TextEncoder !== 'undefined') {
    return Array.from(new TextEncoder().encode(input));
  }
  return Array.from(input).map((c) => c.charCodeAt(0) & 0xff);
};

export type CipherType =
  | 'caesar'
  | 'rot13'
  | 'atbash'
  | 'vigenere'
  | 'a1z26'
  | 'hex'
  | 'binary'
  | 'morse'
  | 'base64'
  | 'enigma';

export const CipherLib = {
  caesar: (input: string, shift: number) => {
    if (!Number.isFinite(shift)) shift = 0;
    const s = ((n: number) => ((n % 26) + 26) % 26)(shift);
    return input.toUpperCase().replace(/[A-Z]/g, (char) => {
      const idx = ALPHA.indexOf(char);
      if (idx === -1) return char;
      return ALPHA[(idx + s) % 26] || char;
    });
  },

  rot13: (input: string) => {
    return CipherLib.caesar(input, 13);
  },

  caesarBruteForce: (input: string) => {
    const results: Array<{ shift: number; text: string }> = [];
    for (let s = 1; s < 26; s++) {
      const text = input.toUpperCase().replace(/[A-Z]/g, (c) => ALPHA[(ALPHA.indexOf(c) - s + 26) % 26]);
      results.push({ shift: s, text });
    }
    return results;
  },

  atbash: (input: string) => {
    return input.toUpperCase().replace(/[A-Z]/g, (char) => {
      const idx = ALPHA.indexOf(char);
      if (idx === -1) return char;
      return ALPHA[25 - idx];
    });
  },

  a1z26: (input: string) => {
    if (/[0-9]/.test(input)) {
      // decode numbers to letters
      return input.split(/[^0-9]+/).map(n => {
        const num = parseInt(n, 10);
        return (num > 0 && num <= 26) ? ALPHA[num - 1] : '';
      }).join('');
    } else {
      // encode letters to numbers
      return input.toUpperCase().split('').map(c => {
        const idx = ALPHA.indexOf(c);
        return idx > -1 ? String(idx + 1) : c;
      }).join('-');
    }
  },

  a1z26Encode: (input: string) => {
    return input
      .toUpperCase()
      .split('')
      .map((c) => {
        const idx = ALPHA.indexOf(c);
        return idx > -1 ? String(idx + 1) : c;
      })
      .join('-');
  },

  vigenere: (input: string, key: string, decrypt = true) => {
    if (!key) return input;
    let ki = 0;
    const cleanKey = key.toUpperCase().replace(/[^A-Z]/g, '');
    if (!cleanKey) return input;

    return input.toUpperCase().replace(/[A-Z]/g, (char) => {
      const charIdx = ALPHA.indexOf(char);
      const keyChar = cleanKey[ki % cleanKey.length];
      const keyIdx = ALPHA.indexOf(keyChar);
      let newIdx;
      if (decrypt) newIdx = (charIdx - keyIdx + 26) % 26;
      else newIdx = (charIdx + keyIdx) % 26;
      ki++;
      return ALPHA[newIdx];
    });
  },

  vigenereEncode: (input: string, key: string) => {
    return CipherLib.vigenere(input, key, false);
  },

  // helpers for some encodings
  binaryToString: (bits: string) => {
    const b = bits.replace(/[^01]/g, '');
    const chunks = b.match(/.{1,8}/g) || [];
    return chunks.map(byte => String.fromCharCode(parseInt(byte, 2))).join('');
  },

  stringToBinary: (input: string) => {
    if (!input) return '';
    return toBytes(input)
      .map((b) => b.toString(2).padStart(8, '0'))
      .join(' ');
  },

  hexToString: (hex: string) => {
    try {
      const s = hex.replace(/[^0-9A-Fa-f]/g, '');
      const bytes = s.match(/.{1,2}/g) || [];
      return bytes.map(h => String.fromCharCode(parseInt(h, 16))).join('');
    } catch (e) { return '' }
  },

  stringToHex: (input: string) => {
    if (!input) return '';
    return toBytes(input)
      .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
      .join(' ');
  },

  base64ToString: (b64: string) => {
    try { return atob(b64.trim()); } catch (e) { return '' }
  },

  stringToBase64: (input: string) => {
    try {
      const bytes = toBytes(input);
      let binary = '';
      for (const b of bytes) {
        binary += String.fromCharCode(b);
      }
      return btoa(binary);
    } catch {
      return '';
    }
  },

  morseToString: (txt: string) => {
    return txt.split(' ').map(t => MORSE_DECODE[t] || '?').join('');
  },

  stringToMorse: (input: string) => {
    if (!input) return '';
    return input
      .toUpperCase()
      .split('')
      .map((ch) => MORSE_ENCODE[ch] || ch)
      .join(' ');
  },

  enigmaEncode: (input: string, key: string) => {
    return simpleEnigmaTransform(input, key || '');
  },
};

export function encodeWithCipher(
  text: string,
  type: CipherType,
  options: { shift?: number; key?: string } = {}
): string {
  if (!text) return '';
  switch (type) {
    case 'caesar':
      return CipherLib.caesar(text, options.shift ?? 3);
    case 'rot13':
      return CipherLib.rot13(text);
    case 'atbash':
      return CipherLib.atbash(text);
    case 'vigenere':
      return CipherLib.vigenereEncode(text, options.key ?? '');
    case 'a1z26':
      return CipherLib.a1z26Encode(text);
    case 'hex':
      return CipherLib.stringToHex(text);
    case 'binary':
      return CipherLib.stringToBinary(text);
    case 'morse':
      return CipherLib.stringToMorse(text);
    case 'base64':
      return CipherLib.stringToBase64(text);
    case 'enigma':
      return CipherLib.enigmaEncode(text, options.key ?? '');
    default:
      return text;
  }
}

export default CipherLib;
