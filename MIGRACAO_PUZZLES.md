# Guia de Migração: De Componentes Específicos para CreateClueModal Unificado

## 🔄 Mudança Geral

Antes (❌ Obsoleto):
```tsx
<GlitchPuzzleCreator 
  isOpen={showGlitchCreator}
  onClose={() => setShowGlitchCreator(false)}
  investigationId={investigationId}
  onSaved={handlePuzzleCreated}
/>

<GlitchMegaClueCreator
  isOpen={showMegaCreator}
  onClose={() => setShowMegaCreator(false)}
  investigationId={investigationId}
  onSaved={handleMegaCreated}
/>
```

Depois (✅ Novo):
```tsx
<CreateClueModal 
  isOpen={showCreateClue}
  onClose={() => setShowCreateClue(false)}
  investigationId={investigationId}
  onSaved={handleCardCreated}
/>
```

## 📋 Checklist de Migração

### 1. Remover Importações Antigas
```tsx
// ❌ REMOVER ESTAS LINHAS:
import GlitchPuzzleCreator from './modals/GlitchPuzzleCreator';
import GlitchMegaClueCreator from './modals/GlitchMegaClueCreator';

// ✅ JÁ DEVEM EXISTIR:
import CreateClueModal from './modals/CreateClueModal';
```

### 2. Simplificar Estados
Se você tinha estados separados para cada tipo:
```tsx
// ❌ ANTES:
const [showGlitchCreator, setShowGlitchCreator] = useState(false);
const [showMegaCreator, setShowMegaCreator] = useState(false);

// ✅ DEPOIS:
const [showCreateClue, setShowCreateClue] = useState(false);
```

### 3. Remover Componentes da Renderização
```tsx
// ❌ REMOVER:
{showGlitchCreator && <GlitchPuzzleCreator ... />}
{showMegaCreator && <GlitchMegaClueCreator ... />}

// ✅ MANTER APENAS:
{showCreateClue && <CreateClueModal ... />}
```

### 4. Unificar Handlers
```tsx
// ❌ ANTES:
const handlePuzzleCreated = () => {
  setShowGlitchCreator(false);
  refreshBoard();
};

const handleMegaCreated = () => {
  setShowMegaCreator(false);
  refreshBoard();
};

// ✅ DEPOIS:
const handleCardCreated = (card: any) => {
  setShowCreateClue(false);
  refreshBoard(); // Funciona para todos os tipos
};
```

### 5. Simplificar Botões de Abertura
```tsx
// ❌ ANTES:
<button onClick={() => setShowGlitchCreator(true)}>🧩 Criar Puzzle</button>
<button onClick={() => setShowMegaCreator(true)}>🔐 Criar Mega-Pista</button>

// ✅ DEPOIS:
<button onClick={() => setShowCreateClue(true)}>📄 Criar Evidência</button>
```

## 🔍 Exemplo de Refatoração Completa

### Arquivo Antes:
```tsx
import React, { useState } from 'react';
import GlitchPuzzleCreator from './modals/GlitchPuzzleCreator';
import GlitchMegaClueCreator from './modals/GlitchMegaClueCreator';
import CreateClueModal from './modals/CreateClueModal';

export default function InvestigationBoard({ investigationId }) {
  const [showCreateClue, setShowCreateClue] = useState(false);
  const [showGlitchCreator, setShowGlitchCreator] = useState(false);
  const [showMegaCreator, setShowMegaCreator] = useState(false);

  const handleCardCreated = () => {
    setShowCreateClue(false);
    setShowGlitchCreator(false);
    setShowMegaCreator(false);
    refreshBoard();
  };

  return (
    <div>
      <div className="button-bar">
        <button onClick={() => setShowCreateClue(true)}>📄 Evidência</button>
        <button onClick={() => setShowGlitchCreator(true)}>🧩 Puzzle</button>
        <button onClick={() => setShowMegaCreator(true)}>🔐 Mega-Pista</button>
      </div>

      <CreateClueModal 
        isOpen={showCreateClue}
        onClose={() => setShowCreateClue(false)}
        investigationId={investigationId}
        onSaved={handleCardCreated}
      />

      <GlitchPuzzleCreator 
        isOpen={showGlitchCreator}
        onClose={() => setShowGlitchCreator(false)}
        investigationId={investigationId}
        onSaved={handleCardCreated}
      />

      <GlitchMegaClueCreator
        isOpen={showMegaCreator}
        onClose={() => setShowMegaCreator(false)}
        investigationId={investigationId}
        onSaved={handleCardCreated}
      />

      {/* Board rendering */}
    </div>
  );
}
```

### Arquivo Depois (Refatorado):
```tsx
import React, { useState } from 'react';
import CreateClueModal from './modals/CreateClueModal';

export default function InvestigationBoard({ investigationId }) {
  const [showCreateClue, setShowCreateClue] = useState(false);

  const handleCardCreated = (card: any) => {
    setShowCreateClue(false);
    refreshBoard();
  };

  return (
    <div>
      <div className="button-bar">
        <button onClick={() => setShowCreateClue(true)}>📝 Criar Evidência</button>
      </div>

      <CreateClueModal 
        isOpen={showCreateClue}
        onClose={() => setShowCreateClue(false)}
        investigationId={investigationId}
        onSaved={handleCardCreated}
      />

      {/* Board rendering */}
    </div>
  );
}
```

## 🗂️ Arquivos para Remover (Após Migração Completa)

Se nenhum outro arquivo usar `GlitchPuzzleCreator` ou `GlitchMegaClueCreator`, delete:
- `src/components/modals/GlitchPuzzleCreator.tsx`
- `src/components/modals/GlitchPuzzleCreator.css`
- `src/components/modals/GlitchMegaClueCreator.tsx`
- `src/components/modals/GlitchMegaClueCreator.css`

## ✅ Verificação Pós-Migração

1. **Teste a criação de cada tipo:**
   - [ ] Criar um Documento Padrão
   - [ ] Criar um Quebra-cabeça de Glitch
   - [ ] Criar uma Mega-Pista

2. **Verifique os dados no banco:**
   - [ ] Documentos têm `type: null` ou não têm campo `type`
   - [ ] Glitch Puzzles têm `type: 'glitch_puzzle'`
   - [ ] Mega-Pistas têm `type: 'mega_clue'`

3. **Teste as validações:**
   - [ ] Glitch Puzzle requer ambas as imagens
   - [ ] Mega-Pista requer texto e pelo menos um puzzle selecionado
   - [ ] Documento padrão aceita apenas título

4. **Verifique a busca de puzzles:**
   - [ ] Ao criar Mega-Pista, lista de puzzles existentes aparece
   - [ ] Checkboxes funcionam corretamente
   - [ ] `required_puzzle_ids` é salvo no metadata

5. **Teste integrações:**
   - [ ] Áudio funciona com todos os tipos
   - [ ] UV/Filtro funciona com todos os tipos
   - [ ] Chat funciona com todos os tipos
   - [ ] Dados salvam corretamente no banco

## 🔗 Arquivos Relacionados a Atualizar

Procure por referências a `GlitchPuzzleCreator` ou `GlitchMegaClueCreator`:

```bash
grep -r "GlitchPuzzleCreator\|GlitchMegaClueCreator" src/
```

Atualize todos os imports e chamadas encontrados.

## 📚 Documentação Relacionada

- [REFATORACAO_PUZZLES.md](./REFATORACAO_PUZZLES.md) - Documentação técnica completa da refatoração

---

**Nota**: Esta migração é **retrocompatível**. Cards existentes do tipo `glitch_puzzle` e `mega_clue` funcionarão perfeitamente com o novo sistema.
