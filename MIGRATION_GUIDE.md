# 🔄 Guia de Migration - Correções Implementadas

**Para**: Desenvolvedores trabalhando com Cards e Animações  
**Data**: 01/01/2026  

---

## ⚠️ Breaking Changes

### 1. EvidenceCardContent não renderiza container

**ANTES**:
```tsx
export function EvidenceCardContent() {
  return (
    <div className="card-content-container locked-view">
      {/* conteúdo */}
    </div>
  );
}

// Uso:
<EvidenceCardContent id={id} />
```

**DEPOIS**:
```tsx
export function EvidenceCardContent() {
  return (
    <>
      {/* conteúdo sem container */}
    </>
  );
}

// Uso:
<div className={contentContainerClass}>
  <EvidenceCardContent id={id} />
</div>
```

**Ação Necessária**: ✅ AUTOMÁTICA - Já implementado em EvidenceCard

---

### 2. Z-Index: De hardcoded para CSS variables

**ANTES**:
```css
.my-modal {
  z-index: 2100;
}
```

**DEPOIS**:
```css
.my-modal {
  z-index: var(--z-modal-base);  /* 1100 */
}
```

**Valores Disponíveis**:
```css
--z-background: -1
--z-base: 0
--z-card-hover: 10
--z-dropdown: 50
--z-modal-backdrop: 1000
--z-modal-base: 1100
--z-modal-top: 1200
--z-tooltip: 1300
--z-debug: 9999
```

**Ação Necessária**: 🔍 Revisar seus arquivos CSS e usar variables

---

### 3. Accessibility: prefers-reduced-motion agora obrigatório

**ANTES**:
```css
.glitch-effect {
  animation: glitch 0.3s infinite;
}
/* Nenhuma media query */
```

**DEPOIS**:
```css
.glitch-effect {
  animation: glitch 0.3s infinite;
}

@media (prefers-reduced-motion: reduce) {
  .glitch-effect {
    animation: none;
  }
}
```

**Ação Necessária**: 📋 Adicionar media queries em todos os novos animações CSS

---

## 🆕 Novas APIs Disponíveis

### cardTestHelper.ts

**Importar**:
```typescript
import { 
  queryCard, 
  queryAllCards, 
  addDebugPanel,
  testCard 
} from '@/utils/cardTestHelper';
```

**Usar no Código**:
```typescript
// Testar card específico
const card = queryCard('card-123');
if (card.locked && card.playerView) {
  console.log('Card está bloqueado para jogador');
}

// Buscar todos
const allCards = queryAllCards();
console.log(`Total: ${allCards.length} cards`);

// Test mode com UI
if (process.env.NODE_ENV === 'development') {
  addDebugPanel();
}
```

**Usar no Console** (dev mode):
```javascript
// Automaticamente disponível como window.CardTest
CardTest.logAllCards()
CardTest.queryCard('0')
CardTest.testCard('0')
CardTest.addDebugPanel()
```

---

## 📝 Checklist para Novo Código

### Ao criar novo componente com animações

- [ ] Adicionar `@media (prefers-reduced-motion: reduce)`
- [ ] Usar `will-change` ao invés de `transition` (quando possível)
- [ ] Não usar z-index hardcoded, usar `var(--z-*)`
- [ ] Não manipular DOM diretamente em testes, usar `data-testid`
- [ ] Documentar ordem de precedência em JSDoc

### Template para novo CSS animado

```css
/* Componente */
.novo-componente {
  animation: minha-animacao 0.5s ease-in-out infinite;
}

/* Acessibilidade */
@media (prefers-reduced-motion: reduce) {
  .novo-componente {
    animation: none;
    /* Fallback visual */
    opacity: 0.5;
  }
}
```

### Template para novo Modal

```tsx
export function MeuModal() {
  return (
    <div 
      className="meu-modal"
      style={{ zIndex: 'var(--z-modal-base)' }}
    >
      {/* conteúdo */}
    </div>
  );
}
```

---

## 🚀 Exemplos Práticos

### Exemplo 1: Adicionar nova animação

```css
/* ✅ Correto */
.novo-efeito {
  animation: slide-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  will-change: transform, opacity;
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .novo-efeito {
    animation: none;
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Exemplo 2: Novo Modal com Z-Index correto

```tsx
interface MyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MyModal({ isOpen, onClose }: MyModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop"
        style={{ zIndex: 'var(--z-modal-backdrop)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="modal-content"
        style={{ zIndex: 'var(--z-modal-base)' }}
        data-testid="my-modal"
      >
        {/* conteúdo */}
      </div>
    </>
  );
}
```

### Exemplo 3: Testar card sem quebrar React

```typescript
// ❌ NÃO FAÇA
const card = document.querySelector('.card');
card.innerHTML = 'novo conteúdo';  // Quebra React!
card.classList.add('glitch-view'); // Desincroniza com estado

// ✅ FAÇA ASSIM
import { queryCard } from '@/utils/cardTestHelper';

const cardState = queryCard('card-123');
console.log(cardState);  // { cardType: 'glitch', locked: false, ... }
```

---

## 🔍 Debugging

### Problema: Animação não sincronizada

**Verificação**:
```css
/* Todos devem ter MESMA duração de animation */
.glitch-1 { animation: glitch 0.3s infinite; }
.glitch-2 { animation: glitch 0.3s infinite; }  /* ✅ Same */
.glitch-3 { animation: glitch 0.3s infinite; }  /* ✅ Same */

/* Offset é feito via animationDelay, não duration */
.glitch-2 { animation-delay: 0.1s; }
.glitch-3 { animation-delay: 0.2s; }
```

### Problema: Z-Index não funciona

**Verificação**:
```typescript
// DevTools > Elements > Computed Styles
console.log(
  window.getComputedStyle(element).zIndex
);
// Deve ser: 1100, 1200, etc (não 2100, hardcoded)
```

### Problema: Console injection quebrou

**Solução**:
```typescript
// Remova TESTE_INJECAO_CONSOLE.js
rm docs/TESTE_INJECAO_CONSOLE.js

// Use o novo helper
CardTest.addDebugPanel()
CardTest.logAllCards()
```

---

## 📖 Referências

- [CORRECOES_CONFLITOS.md](./CORRECOES_CONFLITOS.md) - Documentação técnica completa
- [RESUMO_CORRECOES.md](./RESUMO_CORRECOES.md) - Resumo executivo
- [W3C: prefers-reduced-motion](https://www.w3.org/TR/mediaqueries-5/#prefers-reduced-motion)
- [MDN: Z-Index](https://developer.mozilla.org/en-US/docs/Web/CSS/z-index)

---

## ❓ FAQ

### P: Posso ainda usar z-index hardcoded?
**R**: Não. Use `var(--z-*)` sempre. Se precisar de novo nível, adicione a `:root` primeiro.

### P: Minhas animações têm que respeitar prefers-reduced-motion?
**R**: Sim, é acessibilidade. WCAG 2.1 exigido.

### P: Posso manipular o DOM com `innerHTML` em testes?
**R**: Não. Use `cardTestHelper` ou adicione `data-testid` attributes.

### P: Como mudar a ordem de precedência de view (GM/Locked/Glitch)?
**R**: Edite `EvidenceCardContent.tsx` - seção "LÓGICA CORRIGIDA".

### P: Onde adiciono novos z-index levels?
**R**: Em `:root` de `src/styles/nexus.css`.

---

## 🎓 Conclusão

As correções implementadas garantem:
- ✅ **Sem conflitos** - CSS, animações, DOM isolados
- ✅ **Acessível** - WCAG 2.1 compliant
- ✅ **Testável** - Sem quebra de React
- ✅ **Manutenível** - Single source of truth
- ✅ **Performante** - Otimizações CSS aplicadas

**Qualquer dúvida, referência este guia! 📚**

---

**Última atualização**: 01/01/2026  
**Versão**: 1.0  
**Status**: ✅ Stable
