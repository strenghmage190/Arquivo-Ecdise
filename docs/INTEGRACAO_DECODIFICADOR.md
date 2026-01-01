# 🔐 Como Integrar o Decodificador de Anomalias no ARG

## Situação Atual

Atualmente, o **Decodificador de Anomalias** (GlitchMaker) está disponível apenas para o **Game Master** ao criar pistas. Os jogadores não têm acesso direto a ele.

Para transformar isso em uma ferramenta de ARG autêntica, você precisa fazer os jogadores **descobrirem** e **ganharem acesso** a ela de forma narrativa.

---

## 🎯 Opções de Implementação

### Opção 1: Ferramenta Desbloqueável (Recomendado para ARG)

**Conceito**: Os jogadores precisam encontrar uma "chave" ou código para desbloquear o decodificador.

#### Como Implementar:

1. **Adicionar Estado de Desbloqueio**
   ```tsx
   // No InvestigationBoard.tsx ou em um contexto global
   const [decoderUnlocked, setDecoderUnlocked] = useState(false);
   ```

2. **Criar Pista com a Chave**
   - O Game Master cria uma pista especial (ex: "Arquivo corrompido - PROTOCOLO_DELTA.exe")
   - Quando o jogador clica nela, aparece um modal com campo de entrada
   - Código correto: "DELTA-1977" (ou qualquer código que você escolher)
   - Ao acertar, o decodificador é desbloqueado

3. **Adicionar Botão Condicional na Interface**
   ```tsx
   {decoderUnlocked && (
     <button onClick={() => setShowDecoder(true)} className="hud-btn decoder">
       ⚠ DECODIFICADOR v1.7
     </button>
   )}
   ```

#### Narrativa Sugerida:
> *"Encontramos um software fragmentado nos arquivos do Dr. Silva. Parece ser uma ferramenta de análise forense, mas está protegido por senha. No verso da foto dele há uma anotação: 'Protocolo Delta nunca morreu - 1977'..."*

---

### Opção 2: Ferramenta como Pista Especial

**Conceito**: O decodificador é uma "evidência digital" que os jogadores podem arrastar para o quadro.

#### Como Implementar:

1. **Criar Tipo de Pista "Software"**
   ```tsx
   // No CreateClueModal, adicionar tipo:
   type: 'software' | 'document' | 'image' | ...
   ```

2. **Renderizar Diferente no Board**
   ```tsx
   // No EvidenceCard:
   if (card.type === 'software' && card.title === 'DECODIFICADOR_v1.7') {
     return <DecoderTool />;
   }
   ```

3. **Jogador Interage Diretamente**
   - Clicar na carta "DECODIFICADOR_v1.7" abre a ferramenta
   - Permite arrastar imagens de outras pistas para dentro dela

#### Narrativa Sugerida:
> *"[Email recuperado] De: silva@[redacted] Para: equipe@[redacted] Assunto: URGENTE - Backup do Decodificador. Anexo: decodificador_v1.7.exe. 'Se algo acontecer comigo, usem esta ferramenta nas imagens que enviei. As chaves estão nos metadados.'"*

---

### Opção 3: Acesso por Progressão de História

**Conceito**: Desbloqueio automático em determinado ponto da investigação.

#### Como Implementar:

1. **Monitorar Progresso**
   ```tsx
   // Desbloqueia quando X pistas forem conectadas
   useEffect(() => {
     if (connections.length >= 5 && !decoderUnlocked) {
       setDecoderUnlocked(true);
       showNotification("NOVO SOFTWARE DESBLOQUEADO: Decodificador de Anomalias v1.7");
     }
   }, [connections.length]);
   ```

2. **Trigger Narrativo**
   - Após conectar pistas específicas
   - Após resolver um enigma preliminar
   - Após encontrar uma pista "Chave de Acesso"

#### Narrativa Sugerida:
> *"[SISTEMA] Ao conectar as evidências dos locais A, B e C, você percebe um padrão. Os metadados das imagens contêm fragmentos de código que, quando combinados, reconstroem um programa: DECODIFICADOR_ANOMALIAS_v1.7.exe..."*

---

### Opção 4: Ferramenta Externa (Meta-ARG)

**Conceito**: O decodificador existe fora do jogo, como uma "ferramenta real" que os jogadores baixam.

#### Como Implementar:

1. **Criar Página Separada**
   - Rota: `/ferramentas/decodificador`
   - Não aparece em menus normais
   - URL é descoberta através de pistas

2. **Pistas Levam à URL**
   ```
   Exemplo de pista:
   "Acesse o terminal em: [SITE]/ferramentas/decodificador"
   "Use as credenciais: DELTA / 1977"
   ```

3. **Imagens Baixáveis**
   - Jogadores baixam imagens corrompidas do jogo
   - Processam no decodificador externo
   - Descobrem códigos/mensagens
   - Retornam ao jogo com as respostas

#### Narrativa Sugerida:
> *"[Terminal de Dados - LOG 0x4F2A] Conexão estabelecida com servidor remoto: archivo-ecdise.net/ferramentas/decodificador. Credenciais necessárias. Fonte: [Veja código no verso da Foto 17]"*

---

## 🎬 Implementação Recomendada: Sequência Completa

Aqui está um fluxo completo de descoberta narrativa:

### Fase 1: Sementes da Descoberta
**Pista #1**: Email fragmentado
> "Re: Projeto D.E.L.T.A - A ferramenta está pronta. Vou escondê-la nos arquivos do servidor. Senha: ano do projeto."

**Pista #2**: Foto antiga com ano "1977" escrito
**Pista #3**: Documento sobre "Projeto DELTA"

### Fase 2: A Primeira Chave
Quando jogadores conectarem Pista #1 + Pista #2 + Pista #3:
```tsx
// Sistema detecta padrão
if (hasConnection(pista1, pista2) && hasConnection(pista2, pista3)) {
  unlockPrompt("CÓDIGO DESCOBERTO: DELTA-1977");
}
```

### Fase 3: Acesso ao Decodificador
Aparece nova pista no quadro: "📁 ARQUIVO PROTEGIDO - protocolo_delta.enc"

Ao clicar:
```
SISTEMA DE SEGURANÇA
--------------------
Digite a senha de acesso:
[ _ _ _ _ _ - _ _ _ _ ]

[CONFIRMAR] [CANCELAR]
```

Senha correta: `DELTA-1977`

### Fase 4: Desbloqueio
```
ACESSO CONCEDIDO
================
Decodificador de Anomalias v1.7 instalado com sucesso.
Nova ferramenta disponível no HUD.
```

### Fase 5: Primeiro Uso Tutorial
Uma pista corrompida já estava no quadro desde o início: "foto_laboratorio_corrupted.png"

Mensagem do sistema:
> "DICA: A foto do laboratório parece corrompida. Tente usar o Decodificador com as configurações padrão."

---

## 📋 Checklist de Implementação

Para implementar a Opção 1 (Recomendada):

- [ ] Adicionar estado `decoderUnlocked` no store/contexto da investigação
- [ ] Criar modal de entrada de código
- [ ] Adicionar botão "🔐 DECODIFICADOR" no HUD (visível apenas se desbloqueado)
- [ ] Criar trigger para desbloqueio (código correto, progressão, etc)
- [ ] Adicionar notificação visual quando desbloquear
- [ ] Criar pistas narrativas que levem ao código
- [ ] Preparar 1-2 imagens corrompidas para teste inicial

---

## 🔧 Código de Exemplo

```tsx
// InvestigationBoard.tsx - Adicionar estados
const [decoderUnlocked, setDecoderUnlocked] = useState(false);
const [showDecoderModal, setShowDecoderModal] = useState(false);
const [showCodePrompt, setShowCodePrompt] = useState(false);

// Função de verificação de código
const handleCodeSubmit = (code: string) => {
  if (code === "DELTA-1977") {
    setDecoderUnlocked(true);
    setShowCodePrompt(false);
    showNotification("⚠ DECODIFICADOR DE ANOMALIAS v1.7 DESBLOQUEADO");
    // Salvar no localStorage ou banco
    localStorage.setItem(`decoder_unlocked_${investigationId}`, "true");
  } else {
    showNotification("❌ CÓDIGO INVÁLIDO");
  }
};

// No HUD, adicionar botão condicional
{decoderUnlocked && (
  <button 
    className="hud-btn decoder" 
    onClick={() => setShowDecoderModal(true)}
    data-tooltip="Analisador de Dados Corrompidos"
  >
    ⚠ DECODIFICADOR
  </button>
)}

// Modal do Decodificador
{showDecoderModal && (
  <div className="modal-overlay">
    <div className="modal-content decoder-modal">
      <GlitchMaker 
        onSave={(file) => {
          // Processar arquivo...
          setShowDecoderModal(false);
        }}
        onClose={() => setShowDecoderModal(false)}
      />
    </div>
  </div>
)}

// Modal de Código (aparece ao clicar em pista especial)
{showCodePrompt && (
  <CodePromptModal 
    onSubmit={handleCodeSubmit}
    onClose={() => setShowCodePrompt(false)}
  />
)}
```

---

## 🎨 CSS Sugerido para Botão

```css
.hud-btn.decoder {
  background: linear-gradient(135deg, #c6a45f, #8b7a3a);
  border-color: #c6a45f;
  position: relative;
  animation: decoder-pulse 2s infinite;
}

.hud-btn.decoder::before {
  content: '⚠';
  position: absolute;
  left: 8px;
  animation: decoder-glow 1.5s infinite;
}

@keyframes decoder-pulse {
  0%, 100% { box-shadow: 0 0 5px rgba(198, 164, 95, 0.3); }
  50% { box-shadow: 0 0 15px rgba(198, 164, 95, 0.6); }
}

@keyframes decoder-glow {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; text-shadow: 0 0 8px #c6a45f; }
}
```

---

## 🎮 Qual Opção Escolher?

| Opção | Imersão | Dificuldade | Melhor Para |
|-------|---------|-------------|-------------|
| **1. Desbloqueável** | ⭐⭐⭐⭐⭐ | Média | ARG com progressão narrativa |
| **2. Pista Especial** | ⭐⭐⭐⭐ | Baixa | ARG casual, descoberta rápida |
| **3. Por Progressão** | ⭐⭐⭐ | Baixa | ARG linear, tutoriais |
| **4. Meta-ARG** | ⭐⭐⭐⭐⭐ | Alta | ARG hardcore, imersão total |

**Recomendação**: Comece com a **Opção 1** e, se quiser aumentar a complexidade, migre para a **Opção 4**.

---

Quer que eu implemente alguma dessas opções no código?
