// Lightweight cipher utilities used by decoder tools
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

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

  // helpers for some encodings
  binaryToString: (bits: string) => {
    const b = bits.replace(/[^01]/g, '');
    const chunks = b.match(/.{1,8}/g) || [];
    return chunks.map(byte => String.fromCharCode(parseInt(byte, 2))).join('');
  },

  hexToString: (hex: string) => {
    try {
      const s = hex.replace(/[^0-9A-Fa-f]/g, '');
      const bytes = s.match(/.{1,2}/g) || [];
      return bytes.map(h => String.fromCharCode(parseInt(h, 16))).join('');
    } catch (e) { return '' }
  },

  base64ToString: (b64: string) => {
    try { return atob(b64.trim()); } catch (e) { return '' }
  },

  morseToString: (txt: string) => {
    const MORSE: Record<string,string> = { '.-':'A','-...':'B','-.-.':'C','-..':'D','.':'E','..-.':'F','--.':'G','....':'H','..':'I','.---':'J','-.-':'K','.-..':'L','--':'M','-.':'N','---':'O','.--.':'P','--.-':'Q','.-.':'R','...':'S','-':'T','..-':'U','...-':'V','.--':'W','-..-':'X','-.--':'Y','--..':'Z','/':' ' };
    return txt.split(' ').map(t => MORSE[t] || '?').join('');
  }
};

export default CipherLib;
