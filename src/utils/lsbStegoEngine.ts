// utils/lsbStegoEngine.ts

/**
 * Cifra XOR Simples para Criptografia de Jogos/Desafios
 * Se a chave for errada na extração, retorna lixo (gibberish).
 */
export function xorCipher(text: string, key: string): string {
  if (!key) return text; // Se não tem senha, não criptografa
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

/**
 * INJEÇÃO (ENCODE) - Como a vida real funciona:
 * 1. Transforma o áudio Float (-1 a 1) para Int16 (-32768 a 32767)
 * 2. Transforma o texto em bits (0s e 1s)
 * 3. Esconde cada bit no último espaço da amostra de áudio
 */
export function encodeLSB(baseAudio: Float32Array, message: string, password?: string): Float32Array {
  // 1. Criptografa a mensagem se houver senha
  const cipheredMessage = password ? xorCipher(message, password) : message;
  
  // Adiciona um terminador (um caractere nulo \0) para saber onde a mensagem acaba
  const finalMessage = cipheredMessage + '\0';
  
  // Converte a string para um array de bytes
  const textBytes = new TextEncoder().encode(finalMessage);
  
  // Verifica se o áudio é grande o suficiente para esconder a mensagem
  // Precisamos de 8 amostras de áudio para cada caractere (1 byte = 8 bits)
  const requiredSamples = textBytes.length * 8;
  if (requiredSamples > baseAudio.length) {
    throw new Error(`Áudio muito curto! Precisa de ${requiredSamples} amostras, mas só tem ${baseAudio.length}.`);
  }

  // Cria o novo buffer de saída
  const stegoAudio = new Float32Array(baseAudio.length);

  let byteIndex = 0;
  let bitIndex = 0;

  for (let i = 0; i < baseAudio.length; i++) {
    // Converte o Float32 do navegador para o formato Real de 16-bits (WAV de CD)
    // Multiplica por 32767 (limite do Int16) e arredonda
    let intSample = Math.max(-32768, Math.min(32767, Math.round(baseAudio[i] * 32767)));

    if (byteIndex < textBytes.length) {
      // Pega o bit específico (0 ou 1) da letra atual
      const currentByte = textBytes[byteIndex];
      const bit = (currentByte >> bitIndex) & 1;

      // Magia Hacker (Operadores Bitwise):
      // intSample & ~1 = Zera o último bit original (Ex: 15.403 vira 15.402)
      // | bit = Coloca o nosso bit secreto no lugar
      intSample = (intSample & ~1) | bit;

      bitIndex++;
      if (bitIndex >= 8) { // Já lemos os 8 bits desse caractere? Passa pro próximo!
        bitIndex = 0;
        byteIndex++;
      }
    }

    // Converte de volta para Float32 e salva no áudio final
    stegoAudio[i] = intSample / 32767.0;
  }

  return stegoAudio;
}

/**
 * EXTRAÇÃO (DECODE) - O que o Python faz nos CTFs:
 * Agrupa de 8 em 8, e se encontrar o \0, para e revela o texto!
 */
export function decodeLSB(stegoAudio: Float32Array, password?: string): string {
  const extractedBytes: number[] = [];
  let currentByte = 0;
  let bitIndex = 0;

  for (let i = 0; i < stegoAudio.length; i++) {
    // Converte de volta para Int16
    const intSample = Math.round(stegoAudio[i] * 32767);

    // Extrai o ÚLTIMO BIT da amostra (é o equivalente ao "sample % 2" do Python)
    const bit = intSample & 1;

    // Empurra o bit para dentro do byte atual
    currentByte |= (bit << bitIndex);
    bitIndex++;

    // Fechou 8 bits? Temos um caractere!
    if (bitIndex >= 8) {
      // Se achou o caractere Nulo (\0), significa que a mensagem acabou. Pare de ler!
      if (currentByte === 0) {
        break; 
      }
      extractedBytes.push(currentByte);
      currentByte = 0;
      bitIndex = 0;
    }
  }

  // Converte os bytes de volta para texto legível
  const rawText = new TextDecoder().decode(new Uint8Array(extractedBytes));

  // Se tem senha, tenta descriptografar
  return password ? xorCipher(rawText, password) : rawText;
}
