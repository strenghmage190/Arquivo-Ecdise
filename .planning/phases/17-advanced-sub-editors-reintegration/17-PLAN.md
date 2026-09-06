---
phase: 17
name: Advanced Sub-editors Reintegration
wave: 1
status: Pending
requirements:
  - MOD-09
autonomous: true
files_modified:
  - src/contexts/ClueModalContext.tsx
  - src/components/modals/CreateClueModal_Refactored.tsx
  - src/components/modals/createclueTabs/TabVisual.tsx
  - src/components/modals/createclueTabs/TabAudio.tsx
---

# Phase 17: Advanced Sub-editors Reintegration

**Goal:** Restaurar o ecossistema de sub-editores pesados (AudioLab, UVEditor, ThermalEditor, etc) que existiam no antigo `CreateClueModal.tsx` para o novo modelo refatorado (`CreateClueModal_Refactored.tsx`). Além disso, os file inputs (para upar imagens de áudio/UV) serão devidamente religados para permitir a interação real do usuário com o sistema.

## must_haves

- `ClueModalContext.tsx` deve armazenar os *triggers* globais para modais: `editorMode`, `showAudioForgeFor`, `uvEditorBaseUrl`, `uvEditorPurpose`, `filterInitialImage`, `showGlitchDesigner`, `showKeypadEditor`, `showForensicEditor`, `showThermalEditor`.
- `CreateClueModal_Refactored.tsx` deve importar *estaticamente* `UVEditor`, `AudioLab`, `ThermalEditor`, `PhoneViewer`, `GlitchImageEngine`, `ForensicChannelEditor`, `NumericKeypad`, e `PatternLock`.
- Esses editores devem ser renderizados usando `createPortal(..., document.body)` no final do `CreateClueModal_Refactored.tsx` baseados no estado do Contexto.
- `TabVisual.tsx` deve possuir inputs `<input type="file" hidden />` para a Imagem Base, Camada UV, e Filtros. Os botões do design Cyberpunk acionarão `.click()` nesses inputs, ou ativarão os editores de contexto.
- `TabAudio.tsx` deve possuir inputs de arquivo escondidos para carregar Áudio Base e Áudio Oculto, e botões "Abrir AudioLab" que ativam `showAudioForgeFor`.
- Tipagem do Typescript deve permanecer 100% íntegra.

---

## Wave 1 — Context Extension & Static Imports

### Task 1.1: Expandir ClueModalContext.tsx

<read_first>
- src/contexts/ClueModalContext.tsx
</read_first>

<action>
Modify `ClueModalContext.tsx`:

1. Adicionar à `MediaState` (ou criar um novo `EditorState`) os seguintes atributos:
   - `editorMode: 'uv' | 'filter' | 'rgb' | null`
   - `uvEditorBaseUrl: string | null`
   - `uvEditorPurpose: 'forensic' | null`
   - `filterInitialImage: File | null`
   - `showAudioForgeFor: 'hidden' | 'base' | null`
   - `showGlitchDesigner: boolean`
   - `showKeypadEditor: boolean`
   - `showForensicEditor: boolean`
   - `showThermalEditor: boolean`
2. Adicionar esses mesmos atributos aos valores padrão do hook `useState`.
</action>

<acceptance_criteria>
- The context successfully exports all required overlay trigger states.
</acceptance_criteria>

### Task 1.2: Renderizar Modais via Portal no Modal Refatorado

<read_first>
- src/components/modals/CreateClueModal_Refactored.tsx
- src/components/modals/CreateClueModal.tsx
</read_first>

<action>
Modify `CreateClueModal_Refactored.tsx`:

1. Importar todos os editores estaticamente do diretório `../tools/`:
   `import UVEditor from '../tools/UVEditor';`
   `import AudioLab from '../tools/audiolab/AudioLab';` (Remover React.lazy do AudioLab, mas mantendo o nome do componente base)
   `import PhoneViewer from '../tools/PhoneViewer';` etc.
2. Usar o hook `useClueModal()` para ler `editorMode`, `showAudioForgeFor`, etc.
3. Injetar no final do JSX retornado, fora do container principal, o mesmo bloco de código legado (copiado de `CreateClueModal.tsx`) responsável por abrir:
   - `{editorMode && (previewUrl || uvEditorBaseUrl) && createPortal(<UVEditor .../>, document.body)}`
   - `{showAudioForgeFor && <AudioLab isOpen={!!showAudioForgeFor} ... />}`
   A lógica de `onSave` desses modais deve invocar `setMediaState` / `registerUrl` usando o hook do contexto.
</action>

<acceptance_criteria>
- Advanced editors render correctly in `document.body` when triggered.
- `onSave` logic updates `ClueModalContext`.
</acceptance_criteria>

---

## Wave 2 — Religar Funcionalidades das Abas

### Task 2.1: Religar Inputs e Triggers na TabVisual.tsx

<read_first>
- src/components/modals/createclueTabs/TabVisual.tsx
</read_first>

<action>
Modify `TabVisual.tsx`:

1. Inserir referências de HTML para botões de UV/Filtros.
2. Adicionar os `<input type="file" accept="image/*" hidden onChange={handleUvSelect} />`.
3. Conectar a função de `handleUvSelect` (gerando URL temporária e guardando `setMediaState({ uvFile: file })`).
4. Ao clicar no botão de configurar Lupa UV, garantir que chame `setEditorMode('uv')` se a Imagem Base existir, passando o arquivo base para o modal `UVEditor`.
</action>

<acceptance_criteria>
- File inputs for secondary layers (UV/Filter) are physically present in the DOM.
- The Cyberpunk UI buttons trigger the correct files/modals.
</acceptance_criteria>

### Task 2.2: Religar Inputs e Triggers na TabAudio.tsx

<read_first>
- src/components/modals/createclueTabs/TabAudio.tsx
</read_first>

<action>
Modify `TabAudio.tsx`:

1. Inserir referências `useRef<HTMLInputElement>` para o `audioBase` e `audioHidden`.
2. Adicionar `<input type="file" accept="audio/*" hidden onChange={handleAudioSelect} />` abaixo dos respectivos botões.
3. Botão "Abrir AudioLab" deve simplesmente chamar `setShowAudioForgeFor('base')` ou `'hidden'`, delegando o carregamento/edição para o AudioLab renderizado no portal do componente pai.
</action>

<acceptance_criteria>
- You can physically click to select audio via the inputs.
- AudioLab correctly mounts via the triggers.
</acceptance_criteria>

---

## Verification

### Automated
```bash
npx tsc --noEmit
```

### Manual Checklist
1. Adicionar uma "Imagem Base" no TabVisual.
2. Clicar no botão para configurar "Camada UV". O UVEditor DEVE abrir em tela inteira sem spinners.
3. Salvar no UVEditor e garantir que o estado na TabVisual mostre que a Camada UV foi carregada.
4. Navegar até TabAudio.
5. Selecionar um Áudio Base do explorador de arquivos. O indicador deve exibir `[ ✓ ] Áudio Base carregado`.
6. Clicar em "Abrir AudioLab (Base)". A janela de espectrograma deve abrir na tela inteira.
7. Fechar ou salvar, garantindo o fluxo perfeito da aplicação sem perdas do "Diegetic Window".
