/// <reference types="jest" />
import CipherLib, { encodeWithCipher } from '../ciphers';

describe('CipherLib & encodeWithCipher', () => {
  describe('César & ROT13', () => {
    it('codifica César com shift positivo e negativo mantendo pontuação', () => {
      expect(CipherLib.caesar('HELLO WORLD!', 3)).toBe('KHOOR ZRUOG!');
      expect(CipherLib.caesar('KHOOR ZRUOG!', -3)).toBe('HELLO WORLD!');
      expect(encodeWithCipher('ABC', 'caesar', { shift: 29 })).toBe('DEF');
    });

    it('rot13 é simétrico', () => {
      const encoded = CipherLib.rot13('ECDYSE');
      expect(encoded).toBe('RPQLFR');
      expect(CipherLib.rot13(encoded)).toBe('ECDYSE');
      expect(encodeWithCipher('ECDYSE', 'rot13')).toBe('RPQLFR');
    });
  });

  describe('Atbash', () => {
    it('espelha o alfabeto de forma simétrica', () => {
      expect(CipherLib.atbash('AZ BY')).toBe('ZA YB');
      expect(CipherLib.atbash(CipherLib.atbash('ARQUIVO ECDISE'))).toBe('ARQUIVO ECDISE');
      expect(encodeWithCipher('ABC', 'atbash')).toBe('ZYX');
    });
  });

  describe('Vigenère', () => {
    it('codifica e decodifica com chave alfabética', () => {
      const cipher = CipherLib.vigenereEncode('ATTACKATDAWN', 'LEMON');
      expect(cipher).toBe('LXFOPVEFRNHR');
      expect(CipherLib.vigenere(cipher, 'LEMON', true)).toBe('ATTACKATDAWN');
      expect(encodeWithCipher('ATTACKATDAWN', 'vigenere', { key: 'LEMON' })).toBe('LXFOPVEFRNHR');
    });

    it('retorna texto original quando chave está vazia', () => {
      expect(CipherLib.vigenereEncode('HELLO', '')).toBe('HELLO');
    });
  });

  describe('A1Z26', () => {
    it('codifica letras em números 1-26 e decodifica de volta', () => {
      expect(CipherLib.a1z26Encode('ABC')).toBe('1-2-3');
      expect(CipherLib.a1z26('ABC')).toBe('1-2-3');
      expect(CipherLib.a1z26('1-2-3')).toBe('ABC');
      expect(encodeWithCipher('XYZ', 'a1z26')).toBe('24-25-26');
    });
  });

  describe('Hexadecimal', () => {
    it('codifica string para hex e decodifica de volta', () => {
      const hex = CipherLib.stringToHex('HI');
      expect(hex).toBe('48 49');
      expect(CipherLib.hexToString(hex)).toBe('HI');
      expect(encodeWithCipher('ECD', 'hex')).toBe('45 43 44');
    });
  });

  describe('Binário', () => {
    it('codifica string para binário 8-bit e decodifica de volta', () => {
      const bin = CipherLib.stringToBinary('AB');
      expect(bin).toBe('01000001 01000010');
      expect(CipherLib.binaryToString(bin)).toBe('AB');
      expect(encodeWithCipher('A', 'binary')).toBe('01000001');
    });
  });

  describe('Morse', () => {
    it('codifica texto para Morse e decodifica de volta', () => {
      const morse = CipherLib.stringToMorse('SOS AB');
      expect(morse).toBe('... --- ... / .- -...');
      expect(CipherLib.morseToString(morse)).toBe('SOS AB');
      expect(encodeWithCipher('SOS', 'morse')).toBe('... --- ...');
    });
  });

  describe('Base64', () => {
    it('codifica e decodifica Base64 corretamente', () => {
      const b64 = CipherLib.stringToBase64('ARQUIVO');
      expect(b64).toBe('QVJRVUlWTw==');
      expect(CipherLib.base64ToString(b64)).toBe('ARQUIVO');
      expect(encodeWithCipher('ARQUIVO', 'base64')).toBe('QVJRVUlWTw==');
    });
  });

  describe('Enigma', () => {
    it('aplica transformação Enigma consistente com simpleEnigmaTransform', () => {
      const encoded = CipherLib.enigmaEncode('HELLO WORLD!', 'CHAVE42');
      expect(encoded).not.toBe('HELLO WORLD!');
      expect(encoded.endsWith('!')).toBe(true);
      expect(CipherLib.enigmaEncode('HELLO WORLD!', 'CHAVE42')).toBe(encoded);
      expect(encodeWithCipher('SECRET', 'enigma', { key: 'K1' })).toBe(
        CipherLib.enigmaEncode('SECRET', 'K1')
      );
    });
  });

  describe('Entradas vazias', () => {
    it('retorna string vazia para texto vazio em encodeWithCipher', () => {
      expect(encodeWithCipher('', 'caesar')).toBe('');
      expect(encodeWithCipher('', 'hex')).toBe('');
      expect(encodeWithCipher('', 'morse')).toBe('');
    });
  });
});
