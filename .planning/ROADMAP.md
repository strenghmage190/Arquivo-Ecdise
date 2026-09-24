# Roadmap: v2.1 Performance e Otimização Global

**3 phases** | **8 requirements mapped** | All covered ✓

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 12 | Otimização Estrutural e de Mídia | Configurar lazy loading de rotas e otimização de imagens | IMG-01, IMG-02, RND-01 | 3 |
| 13 | Refatoração CSS e Re-renders | Blindar componentes com React.memo e remover estilos CSS pesados | CSS-01, CSS-02, RND-02 | 3 |
| 14 | Virtualização do DOM | 1/1 | Complete   | 2026-09-24 |
| 15 | Estado Global & Debounce | Extrair estados massivos para Zustand e adicionar debounce no Realtime | OPT-01, OPT-02 | 3 |

### Phase Details

### Phase 12: Otimização Estrutural e de Mídia
Goal: Configurar lazy loading de rotas e otimização de imagens
Requirements: IMG-01, IMG-02, RND-01
Success criteria:
1. Navegador carrega telas apenas sob demanda (Network tab verifica os chunks divididos).
2. `vite-plugin-image-optimizer` instalado e configurado no Vite.
3. Tags de imagem possuem `loading="lazy"`.

### Phase 13: Refatoração CSS e Re-renders
Goal: Blindar componentes com React.memo e remover estilos CSS pesados
Requirements: CSS-01, CSS-02, RND-02
Success criteria:
1. Digitação em inputs não causa travamentos e nem re-renders excessivos.
2. Inexistência de `backdrop-blur` nas listas e cards repetidos.
3. Inexistência de `shadow-2xl` em listas, usando apenas bordas sutis.

### Phase 14: Virtualização do DOM
Goal: Implementar scroll virtual em listas gigantes para eliminar travamentos
Requirements: DOM-01, DOM-02
Success criteria:
3. `react-virtuoso` renderiza apenas os itens no viewport.
4. Scroll de milhares de itens é realizado sem drop de FPS.

### Phase 15: Estado Global & Debounce
Goal: Extrair estados massivos para Zustand e adicionar debounce no Realtime
Requirements: OPT-01, OPT-02
Success criteria:
1. `zustand` instalado e armazenando o estado do `InvestigationBoard`.
2. Supabase Realtime usa debounce nas atualizações de posições (x/y).
3. Performance de arrastar cards aprimorada (sem delays).

