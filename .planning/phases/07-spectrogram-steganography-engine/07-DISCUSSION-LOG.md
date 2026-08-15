# Phase 7 Discussion Log

**Phase:** 07 — High-Fidelity Spectrogram Steganography Engine  
**Date:** 2026-08-15

## Areas Discussed

### 1. Entrada da imagem oculta
- **Opções apresentadas:** Upload de imagem / Desenho direto no canvas / Texto/Código cifrado / Todos os três
- **Decisão:** Todos os três — Abas: Imagem / Desenho / Texto

### 2. Mascaramento acústico
- **Opções apresentadas:** Ruído Rosa / Blend sobre áudio existente / Silencioso / Blend + fallback Rosa
- **Decisão:** Blend sobre áudio base + opção de ruído rosa como fallback se não tiver áudio

### 3. Frequências alvo
- **Opções apresentadas:** 1-8 kHz / 8-16 kHz / Slider ajustável / Ultrassônico
- **Decisão:** Slider ajustável (padrão 8k–18k)

### 4. Preview em tempo real
- **Opções apresentadas:** Preview estático / Preview dinâmico / Preview via reprodutor
- **Decisão:** Preview dinâmico em tempo real sem precisar re-gerar o áudio

### 5. Colormaps do preview
- **Opções apresentadas:** Cyber Neon / Inferno / Viridis / Todos os três
- **Decisão:** Três colormaps com selector (Cyber Neon, Inferno, Viridis)

### 6. Intensidade / amplitude do sinal oculto
- **Opções apresentadas:** Slider fixo 0-100% / Slider de intensidade + slider de mistura / Auto-calibrado
- **Decisão:** Slider de intensidade (brilho espectrograma) + slider de mistura (proporção blend)

### 7. Duração do áudio gerado
- **Opções apresentadas:** Fixo 5s / Baseado na largura da imagem / Campo livre 1-60s / Mesmo tamanho do áudio base
- **Decisão:** Campo de duração livre (1-60s) + preview mostrando proporção

### 8. Output final
- **Opções apresentadas:** WAV / WAV + export WAV ou MP3 / URL Supabase / Blob in-memory
- **Decisão:** WAV interno + export WAV ou MP3 a escolha do usuário

### 9. Layout do modal AudioLab
- **Opções apresentadas:** Tela cheia tipo Audacity / Modal 90vw / Portal separado por ferramenta
- **Decisão:** Tela cheia tipo Audacity — 3 colunas (controles | canvas central | camadas/export)
