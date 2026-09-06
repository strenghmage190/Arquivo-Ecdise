---
phase: 13
name: Basic Tabs Extraction & UX Tooltips
wave: 1
status: Pending
requirements:
  - MOD-01
  - MOD-02
  - MOD-03
  - UX-03
autonomous: true
files_modified:
  - src/components/modals/createclueTabs/TabVisual.tsx
  - src/components/modals/createclueTabs/TabAudio.tsx
  - src/components/modals/CreateClueModal_Refactored.css
---

# Phase 13: Basic Tabs Extraction & UX Tooltips

**Goal:** Refatorar as abas de Mídia (Visual e Áudio) para adotar o sistema de design Cyberpunk do modal full-screen. Isso inclui implementar "Rich Previews" com Grid interativo para as imagens e Tooltips padronizados (`.cyber-tooltip`) para as funcionalidades avançadas.

## must_haves

- `TabVisual` deve exibir a pré-visualização de imagem (`mediaState.previewUrl`) centralizada sobre um grid cibernético (`.cc-media-grid`).
- `TabAudio` deve adotar as classes `.cc-section-header`, `.cc-section-title` e usar tooltips para explicar o funcionamento de Áudio Oculto (Spectrogram Steganography).
- Todas as abas (`TabVisual`, `TabAudio`) perdem o velho `.field-block` em favor do `.cc-tab-content`.
- Separadores lógicos (`<hr className="cc-divider" />`) aplicados entre diferentes blocos de mídia/configuração.
- Ícones `<Info>` com suporte ao `react-tooltip` aplicados em todos os jargões do app (Fake Phone, Lupa UV, Áudio Oculto).
- `npx tsc --noEmit` executa sem erros.

---

## Wave 1 — Visual Tab & Media Grid

### Task 1.1: Criar CSS do Grid Cyberpunk

<read_first>
- src/components/modals/CreateClueModal_Refactored.css
</read_first>

<action>
Modify `CreateClueModal_Refactored.css`:

1. Adicionar os estilos do Grid de Preview e Containers de Imagem ao final do arquivo:
```css
/* ─── MEDIA PREVIEW GRID ─── */
.cc-media-grid {
  position: relative;
  width: 100%;
  min-height: 200px;
  max-height: 350px;
  background-color: rgba(5, 8, 10, 0.95);
  background-image: 
    linear-gradient(rgba(0, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 20px 20px;
  border: 1px dashed var(--cc-neon-dim);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.8);
  margin-top: 12px;
}

.cc-media-grid img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 0 10px rgba(0, 255, 255, 0.2));
  z-index: 2;
}

.cc-media-grid::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, transparent 40%, rgba(0, 0, 0, 0.6) 100%);
  pointer-events: none;
  z-index: 1;
}
```
</action>

<acceptance_criteria>
- `.cc-media-grid` is defined with a grid background and neon border.
</acceptance_criteria>

### Task 1.2: Refactor TabVisual.tsx

<read_first>
- src/components/modals/createclueTabs/TabVisual.tsx
</read_first>

<action>
Modify `TabVisual.tsx`:

1. Substituir a raiz `<div className="field-block">` por `<div className="cc-tab-content">`.
2. Usar `.cc-section-header` e `.cc-section-title` no lugar de `.field-title`.
3. Substituir o container de preview da imagem existente para utilizar a classe `<div className="cc-media-grid">`.
4. Separar "IMAGEM BASE", "Modo Fake Phone" e "Camada UV / Luz Negra" usando `<hr className="cc-divider" />`.
5. Estilizar e alinhar os tooltips e seus botões (usando `.cc-btn` se necessário).
</action>

<acceptance_criteria>
- `TabVisual` implements the UI design contract (cc- classes).
- Image preview uses `.cc-media-grid`.
- Tooltips are intact and properly labeled.
</acceptance_criteria>

---

## Wave 2 — Audio Tab Refactoring

### Task 2.1: Refactor TabAudio.tsx

<read_first>
- src/components/modals/createclueTabs/TabAudio.tsx
</read_first>

<action>
Modify `TabAudio.tsx`:

1. Substituir a raiz `<div className="field-block">` por `<div className="cc-tab-content">`.
2. Usar `.cc-section-header` e `.cc-section-title` para o título principal e subtítulos.
3. Adicionar Tooltips (Ícone de Info + `react-tooltip`) para as seções de Áudio Base e Áudio Oculto (explicando como o Steganography funciona).
4. Usar `<hr className="cc-divider" />` para separar o Áudio Base do Áudio Oculto.
5. Adicionar a classe `.cc-btn-save` (ou um cyber btn verde) quando o áudio base for aberto, e a `cc-btn-cancel` como padrão.
</action>

<acceptance_criteria>
- `TabAudio` matches the Cyberpunk UI.
- At least 2 `react-tooltip` tooltips exist explaining the audio layers.
- Typescript passes without errors.
</acceptance_criteria>

---

## Verification

### Automated
```bash
npx tsc --noEmit
```

### Manual Checklist
1. Open the modal and navigate to the **Visual** tab.
2. Observe the Grid interface. Upload a test image and ensure it renders properly centered within the `.cc-media-grid`.
3. Hover over the `Info` icons on the Visual tab and verify `.cyber-tooltip` popups render cleanly on dark background.
4. Navigate to the **Áudio** tab.
5. Observe the dividers, section headers, and the new Audio Oculto tooltip.
6. Verify no scrolling or padding issues exist (inherited from Phase 12).
