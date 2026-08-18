# Phase 6: Photoshop-Style Layer Mechanics & Drawing Logic

## Context
This phase redesigns the fundamental drawing and layer mechanics so that `UVEditor` mimics professional raster editors like Photoshop or GIMP. It provides strict control over layer creation and prevents the editor from "auto-creating" layers uncontrollably.

## Decisions
- **Background Layer**: O documento começará com uma camada "Plano de Fundo" (branca, bloqueada por padrão).
- **Drawing Constraints**: Tentativas de pintar sobre camadas bloqueadas, grupos, imagens não rasterizadas ou textos exibirão um Toast de erro e o cursor será bloqueado.
- **Pasting (Ctrl+V)**: Ao colar imagens, o sistema priorizará colar na camada atual (se for uma camada de desenho e estiver vazia/adequada) ou criará uma Nova Camada de Imagem de forma inteligente.
- **Rasterization**: O painel de camadas ganhará uma opção "Rasterizar Camada" para permitir que textos e imagens se tornem desenháveis.

## Proposed Changes

### [MODIFY] `UVEditorInner.tsx`
- **Initialization Logic**: Modify empty document initialization to explicitly create a `Plano de Fundo` drawing layer with a white canvas, locked by default (`locked: true`).
- **`startDrawing` Logic**:
  - Delete `Caso 2` (auto-creation of layers).
  - Inject validation: if the active layer is not `drawing` (and not editing mask), trigger a `toast.error("Rasterize a camada primeiro para poder desenhá-la")` and return `null`.
- **Paste/Clipboard Logic**:
  - Update `handlePaste` to inspect the active layer. If it is an empty drawing layer, draw the pasted image onto it. Otherwise, add it as a new Image layer.
- **Rasterize Action**:
  - Create a new function `rasterizeLayer(id)` that takes an Image or Text layer, renders its bounding box content onto an offscreen canvas, e replaces it with a `drawing` type layer in the state.

### [MODIFY] `LayersPanel.tsx`
- **Context Menu Options**:
  - Expose `onRasterizeLayer` as a prop.
  - Render a `Rasterizar Camada` option in the context menu for layers that are NOT already `drawing` type.

## Verification
- Run `npm run typecheck` to ensure `rasterizeLayer` prop and definitions are sound.
- Start a new blank document and confirm "Plano de Fundo" is created and locked.
- Select "Plano de Fundo", unlock it, and draw (should work).
- Add an Image layer, attempt to draw over it. Confirm the Toast appears.
- Right-click the Image layer, choose "Rasterizar Camada", and draw. Confirm drawing works natively over the image.
