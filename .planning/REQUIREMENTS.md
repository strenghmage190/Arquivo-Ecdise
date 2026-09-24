# Requirements: v2.1 Performance e Otimização Global

## 1. Otimização Visual (CSS/Tailwind)
- [ ] **CSS-01**: Remover `backdrop-blur` de listas e componentes repetitivos, usando cores sólidas semi-transparentes (ex: bg-black/50).
- [ ] **CSS-02**: Remover sombras pesadas (`shadow-2xl`) em elementos repetidos, substituindo por bordas sutis.

## 2. Carregamento de Recursos (Imagens)
- [ ] **IMG-01**: Configurar `vite-plugin-image-optimizer` e `sharp` no `vite.config.ts` para converter imagens para WebP.
- [ ] **IMG-02**: Adicionar atributo `loading="lazy"` em todas as tags `<img>` fora do viewport inicial.

## 3. Otimização de Renderização (React)
- [ ] **RND-01**: Implementar `React.lazy()` e `Suspense` nas rotas principais para Code Splitting.
- [ ] **RND-02**: Aplicar `React.memo` nos componentes que se repetem muito ou que recebem muitos inputs.

## 4. Virtualização (DOM)
- [ ] **DOM-01**: Instalar a biblioteca `react-virtuoso`.
- [ ] **DOM-02**: Refatorar listas e tabelas gigantes para usar `<Virtuoso>`, renderizando apenas os itens visíveis.

## Future Requirements
(Nenhum definido)

## Out of Scope
- Alterações na funcionalidade das ferramentas, backend ou design visual geral, o foco é inteiramente performance de renderização.

## Traceability
- **CSS-01**: Phase 13
- **CSS-02**: Phase 13
- **IMG-01**: Phase 12
- **IMG-02**: Phase 12
- **RND-01**: Phase 12
- **RND-02**: Phase 13
- **DOM-01**: Phase 14
- **DOM-02**: Phase 14
