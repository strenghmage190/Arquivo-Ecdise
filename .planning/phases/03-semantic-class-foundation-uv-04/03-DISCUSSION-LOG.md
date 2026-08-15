# Phase 3: Semantic Class Foundation (UV-04) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-14
**Phase:** 3-Semantic Class Foundation (UV-04)
**Areas discussed:** Utilitários vs classes semânticas, Fronteira dos sliders vs Fase 5, Estilos dinâmicos (botões RGB + cursor), Convenção de nomenclatura

---

## Utilitários vs classes semânticas

### Q1 — Espaçamento single-use
| Option | Description | Selected |
|--------|-------------|----------|
| Containers absorvem espaçamento | Containers semânticos incluem margin/padding internos; menos classes no JSX | ✓ |
| Mini-utilitárias de espaçamento | Classes utilitárias genéricas (.uv-gap-8, .uv-mt-8) reutilizáveis | |
| Híbrido | Semânticas + ~4 utilitárias reais | |

**User's choice:** Containers absorvem espaçamento
**Notes:** Prefere JSX limpo; espaçamento resolve-se dentro dos containers semânticos.

### Q2 — Flex spreads repetidos
| Option | Description | Selected |
|--------|-------------|----------|
| Cada container cuida do próprio flex | Maior duplicação no CSS, zero classes extras no JSX | |
| Uma utilitária compartilhada .uv-flex-row | Reuso real para os ~6 flex-row spread (header actions, botões RGB, Pronto/Cancelar, mask controls) | ✓ |
| Misto: flex de layout no container, botões em .uv-btn-row | Trata botões em linha separadamente | |

**User's choice:** Uma utilitária compartilhada .uv-flex-row
**Notes:** Repetição real de display:flex + gap:8 em ~6 lugares justifica utilitária compartilhada.

### Q3 — marginLeft:'auto'
| Option | Description | Selected |
|--------|-------------|----------|
| Variante da utilitária flex | .uv-flex-row--push para as 3 ocorrências | ✓ |
| Absorvido pelos containers | margin-left:auto no CSS do próprio container | |

**User's choice:** Variante da utilitária flex
**Notes:** Consistente com a decisão da utilitária flex.

### Q4 — Textos auxiliares
| Option | Description | Selected |
|--------|-------------|----------|
| Classe .uv-helper-text | Uma classe para os 4 textos de apoio (hint RGB, descrição, pré-visualização, 'Use pincel/borracha') | ✓ |
| Classe única por texto | Mais específico, mais classes, menos reuso | |
| Misto | Alguns com classe própria, resto via selectores de container | |

**User's choice:** Classe .uv-helper-text
**Notes:** Comportamento de texto auxiliar repetido em 4 lugares justifica classe compartilhada.

---

## Fronteira dos sliders vs Fase 5

### Q1 — O que a Fase 3 faz com os sliders
| Option | Description | Selected |
|--------|-------------|----------|
| Padronizar .uv-range-slider agora | Classe semântica em TODOS os sliders; .uv-range mantido como alias; Fase 5 só faz polish | ✓ |
| Só .uv-range agora | Slider novo nasce na Fase 5 com o polish Nexus | |
| Renomear definitivamente | Breaking: renomeia .uv-range → .uv-range-slider | |

**User's choice:** Padronizar .uv-range-slider agora
**Notes:** Fronteira deliberadamente limpa — Fase 3 dona da classe + base, Fase 5 dona do visual Nexus.

### Q2 — Base funcional agora
| Option | Description | Selected |
|--------|-------------|----------|
| width:100% na base | Base funcional já na Fase 3, consistente com .uv-range atual | ✓ |
| Só atribuir classe, sem regras novas | Todo visual de slider estritamente na Fase 5 | |

**User's choice:** width:100% na base
**Notes:** Sliders sem classe hoje herdam default do browser; base funcional resolve já.

### Q3 — Slider inline de máscara
| Option | Description | Selected |
|--------|-------------|----------|
| Modificador --inline | .uv-range-slider--inline zera width e usa ~120px para caber no flex row | ✓ |
| Todos width:100%, aceitar mudança de layout | Muda o layout atual dos mask controls | |
| Sem width na base, cada contexto define | Cada contexto define o width | |

**User's choice:** Modificador --inline
**Notes:** Preserva o layout inline dos mask controls (UVEditor.tsx:3141).

---

## Estilos dinâmicos (botões RGB + cursor)

### Q1 — Botões RGB
| Option | Description | Selected |
|--------|-------------|----------|
| Classes de estado no CSS | .uv-channel-btn + variante --red/green/blue + .is-active; cores 100% no CSS | ✓ |
| CSS custom property inline | --ch-color inline, resto em classes; meio-termo do UV-04 | |
| Declarar 4ª exceção | Foge da regra 42→3 | |

**User's choice:** Classes de estado no CSS
**Notes:** Troca de className é edição de estilo, não lógica — permitida.

### Q2 — <strong> canal selecionado
| Option | Description | Selected |
|--------|-------------|----------|
| Classes de cor como os botões | .uv-channel-name + variantes --red/green/blue | ✓ |
| Herança CSS via sibling selector | Cor herdada do botão ativo via CSS | |
| 4ª exceção | Manter inline | |

**User's choice:** Classes de cor como os botões
**Notes:** Consistência com a decisão dos botões RGB.

### Q3 — Cursor do canvas
| Option | Description | Selected |
|--------|-------------|----------|
| Via classes root tool-draw/tool-erase | Reusa o toggle já existente (UVEditor.tsx:2853-2854); zero JSX novo | ✓ |
| Manter inline | Foge da regra 42→3 | |
| Classe .uv-canvas + herança | Classe própria do canvas + herança | |

**User's choice:** Via classes root tool-draw/tool-erase
**Notes:** touch-action e display re-homados para regras de canvas; cursor via tool-draw/tool-erase existentes.

---

## Convenção de nomenclatura

### Q1 — Padrão de nomes
| Option | Description | Selected |
|--------|-------------|----------|
| Flat .uv- kebab-case | Segue o padrão existente (.uv-editor-header) e os nomes-piloto do roadmap | ✓ |
| BEM | .uv-panel__title; mais estruturado, mas diferente do CSS existente | |
| Genéricos sem prefixo | Como primary-btn/ghost-btn do v1.0 | |

**User's choice:** Flat .uv- kebab-case
**Notes:** Consistente com o arquivo atual e os 4 nomes-piloto do roadmap.

### Q2 — Modificadores de estado
| Option | Description | Selected |
|--------|-------------|----------|
| -- para variante, .is- para estado | .uv-channel-btn--red, .uv-range-slider--inline, .is-active | ✓ |
| Tudo classe flat separada | Sem sufixos, mais classes no total | |
| Reusar .active existente | Conflita com tab.active/tool-button.active | |

**User's choice:** -- para variante, .is- para estado
**Notes:** .active já tem significado em outros componentes; .is-active evita colisão.

### Q3 — Organização no CSS
| Option | Description | Selected |
|--------|-------------|----------|
| Bloco novo no fim do UVEditor.css | Seccionado, aditivo, zero risco de regressão | ✓ |
| Arquivo separado UVEditor.semantic.css | Separação física; mais um arquivo CSS | |
| Reorganizar o arquivo inteiro | Mais coeso, mas risco de regressão visual | |

**User's choice:** Bloco novo no fim do UVEditor.css
**Notes:** Classes novas são aditivas; reorganizar inteiro arrisca regressões desnecessárias.

---

## the agent's Discretion

- Distribuição concreta dos ~39 estilos inline nas classes decididas (containers vs utilitárias) — pesquisador/planner decide o mapeamento exato.
- Nomes finais das classes individuais além dos pilares — desde que flat `.uv-` kebab-case.

## Deferred Ideas

None — discussion stayed within phase scope.
