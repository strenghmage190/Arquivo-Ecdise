# Phase 7 Context: High-Fidelity Spectrogram Steganography Engine

**Phase:** 07  
**Name:** High-Fidelity Spectrogram Steganography Engine  
**Date:** 2026-08-15  
**Status:** Context captured

---

## Domain

Build a Web Worker-powered audio synthesis engine that encodes hidden visual content (images, drawings, or text) into audio frequency bins, producing spectrogram-visible steganography with acoustic masking and a full-screen Audacity-like editing workspace.

---

## Decisions

### 1. Hidden Content Input — 3 Modes (Abas)
- **Imagem:** Upload de JPG/PNG, mapeado pixel→frequência como bitmap de intensidade.
- **Desenho:** Canvas interno onde o usuário desenha com pincel livre, gerando uma máscara bitmap.
- **Texto/Código:** Campo de texto + seletor de fonte/tamanho, renderizado em canvas offscreen → bitmap.
- Todos os três modos produzem o mesmo tipo de output interno: um `ImageData` (bitmap grayscale) passado para o Worker.

### 2. Acoustic Masking Strategy
- **Primário:** Blend sobre áudio base importado pelo usuário (música/ambiência). O sinal estégano é adicionado com amplitude configurável por cima do áudio base via Web Audio API mixing.
- **Fallback:** Se não houver áudio base, geração de ruído rosa (Pink Noise) como bed.
- Ambos os modos têm slider independente de mistura.

### 3. Target Frequency Range
- **Padrão:** 8 kHz – 18 kHz (região de agudos altos, imperceptível na maioria dos reprodutores baratos).
- **Controle:** Dois sliders ajustáveis (Hz mínimo e Hz máximo) com limites de 1 kHz a 22 kHz.
- Cada coluna de pixels da imagem de entrada mapeia para um frame de tempo. Cada linha de pixel mapeia para um bin de frequência dentro da faixa configurada.

### 4. Real-Time Preview
- **Preview dinâmico ao vivo:** Enquanto o usuário ajusta parâmetros (faixa Hz, intensidade, duração), um canvas HTML renderiza o espectrograma "virtual" da imagem mapeada em tempo real — **sem re-gerar o áudio completo**.
- O canvas de preview usa o mesmo mapeamento pixel→frequência→colormap do engine final, garantindo fidelidade visual.
- Geração do áudio completo (WAV) é disparada apenas ao clicar em "Gerar Áudio".

### 5. Colormaps do Espectrograma Preview
- **Três opções com seletor:** Cyber Neon (ciano/magenta/#000), Inferno (amarelo/laranja/vermelho/#000), Viridis (verde/azul/amarelo).
- O `ProfessionalSpectrogram` existente já tem Hot, Cyan e Magma — reaproveitar lógica de colormap, expandir para os três definidos acima.

### 6. Intensity Controls
- **Slider de Intensidade (0–100%):** Controla o brilho/amplitude dos bins de frequência do sinal estégano (quanto forte aparece no espectrograma).
- **Slider de Mistura (0–100%):** Controla a proporção do blend entre áudio base e sinal estégano (quanto "abafa" o áudio original).
- Ambos os sliders têm preview ao vivo no canvas de espectrograma.

### 7. Audio Duration
- **Campo livre de duração:** De 1s a 60s, padrão 10s.
- O canvas de preview mostra uma barra indicando a proporção: largura_imagem / duração_total → resolução temporal visual.
- O Worker recebe a duração e distribui as colunas da imagem uniformemente pelo tempo.

### 8. Output Final
- **Working format:** WAV lossless internamente (44.1kHz, 16-bit PCM, mono ou stereo conforme áudio base).
- **Export ao salvar:** Usuário escolhe WAV ou MP3. Para MP3, usar `audioworklet` ou lib leve (ex: `lamejs`).
- **Handoff ao CreateClueModal:** Retorna `File` object (WAV ou MP3) via callback `onSave(file: File)`.

### 9. Modal Layout — Full-screen Audacity-style
- **Estrutura:** Portal `createPortal(..., document.body)` similar ao UVEditor — `position: fixed; inset: 0; z-index: max`.
- **Layout 3-colunas:**
  - **Esquerda (280px):** Controles/parâmetros (modo de entrada, faixa Hz, intensidade, mistura, duração, colormap).
  - **Centro (flex-grow):** Espectrograma preview canvas + waveform visualizer (Wavesurfer.js ou canvas custom).
  - **Direita (240px):** Histórico de versões, camadas de áudio (base + estégano), botões de export/salvar.
- **Topo:** Header com título "AudioLab", tabs da fase (Esteganografia / Editor / Analisador), botão fechar.
- **Código modular:** Cada aba é um subcomponente em `src/components/tools/audiolab/`.

---

## Code Context

### Reusable Assets
- `src/components/tools/ProfessionalSpectrogram.tsx` — Colormap functions (getHotColor, getCyanColor, getMagmaColor) + FFT canvas renderer. **Reutilizar e expandir.**
- `src/components/tools/SpectrogramCreator.tsx` — Worker communication pattern (postMessage/onmessage) + bufferToWav utility. **Reutilizar pattern do Worker.**
- `src/components/tools/spectrogramWorker.ts` — Worker existente para análise. **Criar novo `spectrogramSynthesizerWorker.ts` separado.**
- `src/utils/audioGenerator.ts` — `bufferToWav` função já existe e pode ser importada.
- `src/components/tools/AdvancedAudioLab.tsx` — Wavesurfer.js integration pattern (init, destroy, regions). **Reutilizar para waveform visualizer.**

### Patterns Established (from v1.0)
- Full-screen portal: `createPortal(jsx, document.body)` com `position: fixed; inset: 0; z-index: 2147483647`.
- Cyberpunk/Nexus theme: Neon cyan `#00f3ff`, neon magenta `#ff007a`, dark surface `#0b1220`.
- Lucide React icons: zero emojis; use `Music`, `Waveform`, `Image`, `Type`, `Pencil`, `Download`, `Play`, `Pause`, `Save`.

### New Files to Create
- `src/components/tools/audiolab/` — Diretório principal
  - `AudioLab.tsx` — Container full-screen (portal + 3-column layout)
  - `SteganoPanel.tsx` — Painel de esteganografia (3 abas: imagem/desenho/texto)
  - `SpectrogramPreviewCanvas.tsx` — Canvas preview em tempo real
  - `FrequencyControls.tsx` — Sliders Hz min/max, intensidade, mistura
  - `AudioLayerPanel.tsx` — Base audio loader + layer stack
- `src/workers/spectrogramSynthesizerWorker.ts` — Web Worker: bitmap → sine waves IFFT → PCM buffer

---

## Canonical Refs

- `.planning/REQUIREMENTS.md` — STEG-01, STEG-02, STEG-03, STEG-04 requirements
- `.planning/ROADMAP.md` — Fase 7 scope
- `src/components/tools/SpectrogramCreator.tsx` — Worker pattern de referência
- `src/components/tools/ProfessionalSpectrogram.tsx` — Colormap e FFT canvas de referência
- `src/components/tools/AdvancedAudioLab.tsx` — Wavesurfer.js integration pattern
- `src/utils/audioGenerator.ts` — bufferToWav utilitário

---

## Deferred Ideas

- Decodificador/leitor de esteganografia (detectar imagem oculta em áudio existente) — Fase futura.
- Suporte a áudio FLAC ou OGG — fora do escopo v1.1.
- AI-assisted harmonic masking (detectar frequências da música base e evitá-las) — fase futura.
