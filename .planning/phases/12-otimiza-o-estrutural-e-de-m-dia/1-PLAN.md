---
wave: 1
depends_on: []
files_modified:
  - "vite.config.ts"
  - "src/App.tsx"
  - "package.json"
autonomous: true
---

# Plan 1: Implementação de Otimização de Performance Estrutural e Mídia

## Objective
Configurar Code Splitting (React.lazy) para as rotas e integrar a otimização de imagens via Vite (WebP) com lazy loading, cumprindo os requisitos de diminuição de consumo de RAM e CPU.

## Requirements Covered
- **IMG-01**: Configurar `vite-plugin-image-optimizer` e `sharp` no `vite.config.ts`.
- **IMG-02**: Adicionar atributo `loading="lazy"` nas tags `<img>` fora do viewport. (Nota: A ser executado quando existirem componentes com `<img>` repetidas — para este plano focaremos nas configurações root).
- **RND-01**: Implementar `React.lazy()` e `<Suspense>` no componente principal de rotas.

## Verification Criteria
- `npm run build` finaliza sem erros e os chunks gerados no diretório `/dist/assets` comprovam a separação das rotas.
- Navegação na aplicação deve exibir temporariamente o fallback "Carregando...".
- Imagens buildadas são otimizadas pelo plugin.

## Tasks

<task>
  <id>1</id>
  <title>Instalar dependências de otimização de imagens</title>
  <read_first>
    - package.json
  </read_first>
  <action>
    Instalar `vite-plugin-image-optimizer` e `sharp` como dependências de desenvolvimento (`npm install -D vite-plugin-image-optimizer sharp`).
  </action>
  <acceptance_criteria>
    - `package.json` possui `vite-plugin-image-optimizer` e `sharp` em `devDependencies`.
    - Execução do `npm install` retorna sucesso.
  </acceptance_criteria>
</task>

<task>
  <id>2</id>
  <title>Configurar vite.config.ts para gerar WebP</title>
  <read_first>
    - vite.config.ts
  </read_first>
  <action>
    Importar `ViteImageOptimizer` do `vite-plugin-image-optimizer`.
    Adicionar `ViteImageOptimizer` ao array de `plugins` dentro de `defineConfig` no `vite.config.ts`.
    Configurar o plugin com opções `{ webp: { quality: 80 }, png: { quality: 80 }, jpeg: { quality: 80 } }`.
  </action>
  <acceptance_criteria>
    - `vite.config.ts` contém `import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'`.
    - `vite.config.ts` possui as configurações exatas de `{ webp: { quality: 80 }... }` passadas para a função `ViteImageOptimizer()` dentro do array `plugins`.
  </acceptance_criteria>
</task>

<task>
  <id>3</id>
  <title>Implementar Code Splitting no App.tsx</title>
  <read_first>
    - src/App.tsx
  </read_first>
  <action>
    No `src/App.tsx`, importar `lazy` e `Suspense` do `react`.
    Identificar as páginas importadas estaticamente (ex: `import Home from './pages/Home'`) e transformá-las em importações dinâmicas usando `const Component = lazy(() => import('caminho/do/componente'))`.
    Envolver as `<Routes>` (ou equivalente que contém as páginas) em `<Suspense fallback={<div className="text-white text-center">Carregando...</div>}>`.
  </action>
  <acceptance_criteria>
    - `src/App.tsx` possui chamadas a `lazy(() => import(...))` ao invés de imports estáticos convencionais para os componentes de página.
    - O provider de roteamento está encapsulado por `<Suspense fallback={<div className="text-white text-center">Carregando...</div>}>`.
    - O projeto compila corretamente.
  </acceptance_criteria>
</task>
