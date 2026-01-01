# 🔍 Guia: Criando Enigmas Multi-Etapas com GlitchMaker + DecipherLens

## Visão Geral

Este guia demonstra como combinar o **GlitchMaker** (Analisador de Dados Corrompidos) e o **DecipherLens** (Filtro da Verdade) para criar quebra-cabeças complexos e imersivos no seu ARG.

---

## 🎯 O Conceito

As duas ferramentas funcionam como um sistema de **revelação em camadas**:

1. **GlitchMaker** → Revela pistas visuais ocultas em imagens
2. **DecipherLens** → Decodifica mensagens textuais cifradas

Quando combinadas, elas criam uma cadeia de descoberta que mantém os jogadores engajados e recompensa a atenção aos detalhes.

---

## 📋 Fluxo de um Enigma Completo

### **Etapa 1: A Imagem Corrompida**

Os jogadores recebem um arquivo de imagem aparentemente danificado:
- Nome do arquivo: `amostra_memoria_04.png`
- Aparência: Foto normal com ruídos/estática

**Pista Inicial:**
> "Arquivo recuperado do servidor Ecdise. Metadados indicam corrupção de dados. Parâmetros de recuperação podem estar nas transmissões anteriores."

### **Etapa 2: Encontrando os Parâmetros**

Em outro lugar do ARG (email, áudio, vídeo), os jogadores descobrem:
```
SEQUÊNCIA DE CALIBRAÇÃO #04
Fatias: 32
Deslocamento: 8
Corrupção: 0
```

### **Etapa 3: Análise no GlitchMaker**

1. Jogadores abrem o **Analisador de Dados Corrompidos**
2. Carregam `amostra_memoria_04.png`
3. Inserem os parâmetros descobertos
4. A imagem se reorganiza revelando: um screenshot de terminal com texto cifrado

```
TERMINAL DE ACESSO - NÍVEL 3
§¤¤¥ §¥¤ §¤¥¥¤§ ¥§¤¤ §¤ ¤¥¥¥
```

### **Etapa 4: Decodificação no DecipherLens**

1. Jogadores navegam até a página com o **Filtro da Verdade**
2. O `cipherText` na tela mostra exatamente o texto descoberto
3. Ativam a lente e passam o mouse sobre o texto
4. Revelação da mensagem real:

```
AS COORDENADAS ESTÃO NO ÁUDIO
FREQUÊNCIA: 8.8kHz
CUIDADO, ELES ESCUTAM
```

### **Etapa 5: A Próxima Camada**

A mensagem decodificada leva os jogadores para a próxima etapa do enigma (análise de espectrograma de áudio, etc.)

---

## 🛠️ Implementação Técnica

### **Usando o DecipherLens em uma Página**

```tsx
import DecipherLens from './components/tools/DecipherLens';

function SecretDocument() {
  const cipherText = "§¤¤¥ §¥¤ §¤¥¥¤§ ¥§¤¤ §¤ ¤¥¥¥";
  const realText = "AS COORDENADAS ESTÃO NO ÁUDIO";
  
  return (
    <div className="secret-page">
      <h1>TERMINAL DE ACESSO - NÍVEL 3</h1>
      <DecipherLens 
        cipherText={cipherText}
        realText={realText}
        startActive={false}
        initialRadius={80} // Valor correto do enigma
      />
    </div>
  );
}
```

### **Criando um Enigma de Calibração**

Para tornar o enigma mais desafiador, use um `initialRadius` incorreto. Os jogadores precisam descobrir o valor correto em outro lugar:

```tsx
// O jogador começa com raio errado
<DecipherLens 
  realText="A SENHA É: ECDISE2026"
  cipherText="¤ ¥¤§¥¤ §: §¤¥¥§2026"
  initialRadius={30} // Muito pequeno para ler
/>
```

**Pista em outro documento:**
> "Frequência de ressonância psiônica calibrada para 137hz"

Quando o jogador ajusta o slider para **137hz**, a mensagem fica perfeitamente legível.

---

## 🎨 Criando Texto Cifrado

### **Método 1: Substituição Simples**

```javascript
function createCipher(text) {
  return text.replace(/[A-Za-z0-9]/g, (char) => {
    const symbols = ['§', '¤', '¥', '¢', '€', '£', '¶'];
    return symbols[Math.floor(Math.random() * symbols.length)];
  });
}

const cipher = createCipher("COORDENADAS: 41.4036° N, 2.1744° E");
// Resultado: ¤¤¤¤¥¥¥¤¥¤: 41.4036° ¥, 2.1744° §
```

### **Método 2: Alfabeto Customizado**

```javascript
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const cipher = '§¤¥¢€£¶∆∏∑µ∫∂ƒ©®™Ω≈√∞§¤¥¢€£';

function encode(text) {
  return text.toUpperCase().split('').map(char => {
    const i = alphabet.indexOf(char);
    return i >= 0 ? cipher[i] : char;
  }).join('');
}

const encoded = encode("PROJETO ECDISE");
// Use este texto como cipherText
```

---

## 💡 Dicas para Criar Enigmas Memoráveis

### **1. Camadas de Descoberta**
- Nunca entregue todas as informações de uma vez
- Cada revelação deve levar a uma nova pergunta
- Use as ferramentas em sequência, não isoladamente

### **2. Recompense a Atenção aos Detalhes**
- Esconda parâmetros em lugares inesperados (metadados de arquivos, fundo de vídeos, etc.)
- Use números/códigos que aparecem em múltiplos lugares
- Crie conexões entre diferentes mídias (imagem → texto → áudio)

### **3. Controle a Dificuldade**
- **Fácil:** Parâmetros dados diretamente
- **Médio:** Parâmetros escondidos mas descobríveis
- **Difícil:** Parâmetros calculados a partir de pistas

### **4. Narrativa Integrada**
- Cada ferramenta tem uma identidade no universo do ARG
- As mensagens descobertas devem fazer sentido no contexto da história
- Use linguagem e estética consistentes

---

## 🔐 Exemplo Completo: "A Memória Fragmentada"

### **Arquivo 1: email_interceptado.txt**
```
De: Dr. Carvalho
Para: [REDACTED]
Assunto: Re: Protocolo de Recuperação

Os arquivos do servidor foram corrompidos durante a invasão.
Use o protocolo padrão:
- Fragmentação: 32 segmentos
- Rotação: +8 posições
- Sem corrupção adicional

Boa sorte.
```

### **Arquivo 2: memoria_fragmentada.png**
- Uma imagem aparentemente normal de um laboratório
- Ao aplicar os parâmetros do email no GlitchMaker:
  - **Slices:** 32
  - **Shift:** 8  
  - **Corruption:** 0
- A imagem revela um terminal com texto: `¥¤§¢¥¤§ ¥§ ¢¤¥§ §£¢¥¤¥ ¢§`

### **Arquivo 3: terminal_acesso.html**
```html
<div class="terminal">
  <DecipherLens 
    cipherText="¥¤§¢¥¤§ ¥§ ¢¤¥§ §£¢¥¤¥ ¢§"
    realText="PROJETO EM FASE FINAL CODIGO 7"
    initialRadius={115}
  />
</div>
```

### **Resultado Final:**
O jogador descobre que "CODIGO 7" é a chave para acessar o próximo arquivo/área do jogo.

---

## 🚀 Próximos Passos

Agora que você tem o kit completo:

1. **Planeje sua cadeia de enigmas** do começo ao fim
2. **Crie os assets** (imagens, textos, áudios)
3. **Teste o fluxo** com alguém que não conhece as respostas
4. **Ajuste a dificuldade** baseado no feedback

**Lembre-se:** As melhores puzzles são aquelas que parecem impossíveis até o momento "aha!" onde tudo faz sentido.

---

## 📚 Recursos Relacionados

- [SISTEMA_TERMAL_CRIS.md](./SISTEMA_TERMAL_CRIS.md) - Sistema de câmera termal
- [SISTEMA_DE_CAMADAS.md](./SISTEMA_DE_CAMADAS.md) - Sistema de filtros visuais
- [DECODIFICADOR_ARG.md](./DECODIFICADOR_ARG.md) - Guia do GlitchMaker

---

*"A verdade está em camadas. Descasque-as, uma por uma."*
