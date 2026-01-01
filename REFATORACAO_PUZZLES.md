# Refatoração: Unificação da Criação de Puzzles no CreateClueModal

## 📋 Resumo da Mudança

O sistema de criação de pistas foi **completamente unificado** em um único modal (`CreateClueModal`). Os componentes específicos `GlitchPuzzleCreator` e `GlitchMegaClueCreator` podem agora ser considerados **obsoletos**, pois todas as suas funcionalidades foram integradas ao `CreateClueModal`.

## 🎯 Fluxo de Uso

### 1. Abrir o Modal
O usuário abre o `CreateClueModal` como antes. O modal agora apresenta um novo seletor no topo da aba **"📄 GERAL & DADOS"**.

### 2. Seletor de Tipo de Evidência
Na aba "GERAL & DADOS", há agora um campo obrigatório chamado **"TIPO DE EVIDÊNCIA"** com três opções:

- **📄 Documento Padrão** (comportamento clássico)
- **🧩 Quebra-cabeça de Glitch**
- **🔐 Mega-Pista Final**

### 3. Abas Dinâmicas
Ao selecionar um tipo, o cabeçalho do modal **dinamicamente mostra/oculta abas** específicas:

#### Se "Documento Padrão":
- Mostrada: GERAL & DADOS, VISUAL / UV / FX, ÁUDIO & EVP, CIFRAS & PUZZLES
- Comportamento idêntico ao anterior

#### Se "Quebra-cabeça de Glitch":
- Mostrada: GERAL & DADOS, VISUAL / UV / FX, ÁUDIO & EVP, CIFRAS & PUZZLES, **🧩 CONFIG. GLITCH**
- A aba "CONFIG. GLITCH" contém:
  - Upload de imagem original (revelada ao resolver)
  - Upload de imagem corrompida (o que o jogador vê)
  - 3 sliders para parâmetros corretos: Frequência, Deslocamento, Corrupção Cromática
  - Campo para código de recompensa (ex: ALPHA-01)

#### Se "Mega-Pista Final":
- Mostrada: GERAL & DADOS, VISUAL / UV / FX, ÁUDIO & EVP, CIFRAS & PUZZLES, **🔐 CONFIG. MEGA-PISTA**
- A aba "CONFIG. MEGA-PISTA" contém:
  - Campo de texto para a verdade final (até 2000 caracteres)
  - Upload de imagem final (opcional)
  - **Lista de checkboxes** com todos os Glitch Puzzles da investigação
  - Selecione quais puzzles são necessários para desbloquear a mega-pista

## 📝 Estados Adicionados

### Para Glitch Puzzles:
```typescript
const [glitchOriginalImageFile, setGlitchOriginalImageFile] = useState<File | null>(null);
const [glitchOriginalImagePreview, setGlitchOriginalImagePreview] = useState<string | null>(null);
const [glitchCorruptedImageFile, setGlitchCorruptedImageFile] = useState<File | null>(null);
const [glitchCorruptedImagePreview, setGlitchCorruptedImagePreview] = useState<string | null>(null);
const [glitchCorrectFrequency, setGlitchCorrectFrequency] = useState(17);
const [glitchCorrectShift, setGlitchCorrectShift] = useState(33);
const [glitchCorrectChromatic, setGlitchCorrectChromatic] = useState(12);
const [glitchRewardCode, setGlitchRewardCode] = useState('ALPHA-01');
```

### Para Mega Clues:
```typescript
const [megaFinalTruthText, setMegaFinalTruthText] = useState('');
const [megaImageFile, setMegaImageFile] = useState<File | null>(null);
const [megaImagePreview, setMegaImagePreview] = useState<string | null>(null);
const [megaRequiredPuzzleIds, setMegaRequiredPuzzleIds] = useState<string[]>([]);
const [availablePuzzles, setAvailablePuzzles] = useState<Array<{ id: string; title: string }>>([]);
const [evidenceType, setEvidenceType] = useState<'document' | 'glitch_puzzle' | 'mega_clue'>('document');
```

## 🔧 Lógica do handleSave

A função `handleSave` foi expandida para criar payloads diferentes baseado no `evidenceType`:

### Para Documentos Padrão (`type: null`):
```typescript
const payload = {
  investigation_id,
  title,
  type: null,
  // ... resto dos campos normais
};
```

### Para Glitch Puzzles (`type: 'glitch_puzzle'`):
```typescript
const payload = {
  investigation_id,
  title,
  type: 'glitch_puzzle',
  image_url: glitchCorruptedUrl, // Mostra a imagem corrompida
  metadata: {
    glitch_puzzle: {
      original_image_url: glitchOriginalUrl,
      corrupted_image_url: glitchCorruptedUrl,
      correct_frequency: glitchCorrectFrequency,
      correct_shift: glitchCorrectShift,
      correct_chromatic: glitchCorrectChromatic,
      reward_code: glitchRewardCode,
      solved: false,
    },
  },
};
```

### Para Mega Clues (`type: 'mega_clue'`):
```typescript
const payload = {
  investigation_id,
  title,
  type: 'mega_clue',
  image_url: megaImageUrl, // Imagem final (se fornecida)
  metadata: {
    mega_clue: {
      final_truth_text: megaFinalTruthText,
      required_puzzle_ids: megaRequiredPuzzleIds, // Array de IDs dos puzzles necessários
      collected_codes: [],
    },
  },
};
```

## 📦 Mudanças no Banco de Dados

Nenhuma mudança foi necessária! O sistema usa os campos existentes:
- `type`: Define o tipo de card ('glitch_puzzle', 'mega_clue', ou null para padrão)
- `metadata.glitch_puzzle`: Armazena config de glitch puzzle
- `metadata.mega_clue`: Armazena config de mega clue

## 🔍 Busca de Puzzles Existentes

Quando a aba "CONFIG. MEGA-PISTA" é aberta, o código automaticamente:
1. Busca todos os cards da investigação com `type = 'glitch_puzzle'`
2. Popula a lista de `availablePuzzles` com `id` e `title`
3. Mostra checkboxes para o criador selecionar quais são necessários

```typescript
const fetchAvailablePuzzles = async () => {
  const { data, error } = await supabase
    .from('investigation_cards')
    .select('id, title, metadata')
    .eq('investigation_id', investigationId)
    .eq('type', 'glitch_puzzle');
  
  const puzzles = (data || []).map(card => ({ id: card.id, title: card.title }));
  setAvailablePuzzles(puzzles);
};
```

## ✅ Validações

O `handleSave` agora valida baseado no tipo:

### Documentos Padrão:
- Apenas título é obrigatório

### Glitch Puzzles:
- ✅ Título obrigatório
- ✅ Imagem original obrigatória
- ✅ Imagem corrompida obrigatória

### Mega Clues:
- ✅ Título obrigatório
- ✅ Texto da verdade final obrigatório
- ✅ Pelo menos 1 quebra-cabeça deve ser selecionado

## 🧹 Componentes Obsoletos

Os seguintes componentes podem ser **removidos** ou **deprecados**:
- `GlitchPuzzleCreator.tsx`
- `GlitchMegaClueCreator.tsx`
- `GlitchPuzzleCreator.css`
- `GlitchMegaClueCreator.css`

Se ainda forem referenciados em outros componentes, atualize as importações ou remova os chamados.

## 🎨 Interface Visual

### Seletor de Tipo (Aba GERAL & DADOS):
```
[📄 Documento Padrão] [🧩 Quebra-cabeça de Glitch] [🔐 Mega-Pista Final]
```

### Cores das Abas:
- **Documento Padrão**: Dourado (#c6a45f)
- **Glitch Puzzle**: Azul (#64b5ff)
- **Mega-Pista**: Laranja (#ff6400)

## 📖 Exemplo de Uso Completo

1. **Criar um Glitch Puzzle:**
   - Abrir CreateClueModal
   - Aba "GERAL & DADOS" → Selecionar "🧩 Quebra-cabeça de Glitch"
   - Preencher Título, Descrição, Tags
   - Ir para aba "🧩 CONFIG. GLITCH"
   - Upload imagem original e corrompida
   - Ajustar sliders (Frequência: 17, Deslocamento: 33%, Cromática: 12%)
   - Definir Código de Recompensa (ex: "ALPHA-01")
   - Clicar "REGISTRAR EVIDÊNCIA"

2. **Criar uma Mega-Pista:**
   - Abrir CreateClueModal
   - Aba "GERAL & DADOS" → Selecionar "🔐 Mega-Pista Final"
   - Preencher Título, Descrição, Tags
   - Ir para aba "🔐 CONFIG. MEGA-PISTA"
   - Escrever o texto da verdade final
   - (Opcional) Upload de imagem
   - Marcar checkboxes dos Glitch Puzzles necessários
   - Clicar "REGISTRAR EVIDÊNCIA"

## 🚀 Benefícios da Refatoração

✅ **Fluxo unificado**: Um único ponto de entrada para TODAS as pistas
✅ **Menos confusão**: Não há mais múltiplos modais específicos
✅ **Seletor dinâmico**: As abas aparecem/desaparecem conforme necessário
✅ **Validações melhores**: Cada tipo tem suas próprias regras
✅ **Código mais limpo**: Lógica centralizada, mais fácil de manter
✅ **Seleção intuitiva de puzzles**: Interface visual clara com checkboxes
✅ **Reutilização de campos**: Campos comuns (chat, áudio, etc) funcionam com todos os tipos

## ⚠️ Notas Importantes

- Os campos de Documento Padrão (UV, Filtro, Áudio, Chat, etc) continuam funcionando normalmente para TODOS os tipos
- Ao mudar o tipo de evidência, os dados específicos do tipo anterior são preservados
- O modal reseta todos os campos ao fechar e reabrir
- A lista de puzzles é carregada **automaticamente** quando a aba "CONFIG. MEGA-PISTA" é acessada

---

**Data da Refatoração**: 2026-01-01
**Versão**: 1.0
