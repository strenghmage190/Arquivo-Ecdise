# Phase 8 Context: Forensic Audio DSP & Manipulation Suite

## Domain
Implementação de edição interativa na timeline, filtros DSP de áudio (bandpass, high/lowpass, pitch, etc) e geração de sinais (bed, noise, morse) integrados à suíte `AudioLab`.

## Locked Decisions
Essas são as decisões de implementação acordadas para esta fase. Não questione-as novamente:

### Edição de Waveform / Timeline
- **Abordagem:** Utilizar a biblioteca `wavesurfer.js` com o seu plugin oficial de "Regions".
- **Comportamento:** O usuário poderá selecionar trechos no visualizador e aplicar cortes (slice), aparos (trim) ou silenciar a região.

### Filtros DSP (Digital Signal Processing)
- **Abordagem:** Utilizar a `Web Audio API` nativa (principalmente instâncias de `BiquadFilterNode`).
- **Motivação:** Manter o bundle leve, sem introduzir dependências robustas como `Tone.js`, já que as necessidades (passa-alto, passa-baixo, notch, pitch) são plenamente atendidas nativamente.

### Gerador de Sinais e Camadas (Bed/Synth)
- **Abordagem:** Inserir os controles de geração de áudio num painel lateral em formato de abas (Tabs), integrado perfeitamente dentro do próprio modal fullscreen do `AudioLab`.
- **Motivação:** Consolidação UI (evitar modais flutuantes e navegação desnecessária). O usuário trabalha em apenas uma tela.

## Canonical References
*Nenhuma referência externa anotada no Roadmap.* Considere as decisões acima como verdade canônica para a implementação.
