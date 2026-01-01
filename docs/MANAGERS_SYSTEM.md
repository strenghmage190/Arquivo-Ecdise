# 🔧 Sistema de Managers Centralizados

## Visão Geral

Este documento descreve o sistema de managers centralizados implementado para eliminar **race conditions** e **conflitos de event listeners** na aplicação.

## 📋 Managers Implementados

### 1. **EventManager** (`src/utils/EventManager.ts`)

Gerenciador centralizado de eventos que substitui o uso direto de `window.addEventListener` e `window.dispatchEvent`.

#### Características:
- ✅ **Fila de execução sequencial** - Previne race conditions
- ✅ **Debouncing configurável** - Reduz chamadas excessivas
- ✅ **Controle automático de duplicatas** - Usa `Set` internamente
- ✅ **Cleanup automático** - Retorna função de unsubscribe

#### Uso:

```typescript
import { eventManager } from '../../utils/EventManager';

// Registrar handler
const unsubscribe = eventManager.on('modal:opened', (modalId) => {
  console.log('Modal aberto:', modalId);
});

// Disparar evento imediato
eventManager.emit('modal:opened', 'my-modal-id');

// Disparar com debouncing
eventManager.emitDebounced('conspiracy:remote-update', 500, newData);

// Cleanup
unsubscribe();
```

#### API:

| Método | Descrição |
|--------|-----------|
| `on(eventName, handler)` | Registra handler e retorna função de cleanup |
| `off(eventName, handler)` | Remove handler específico |
| `emit(eventName, ...args)` | Dispara evento imediatamente |
| `emitDebounced(eventName, delay, ...args)` | Dispara evento com debouncing |
| `clear(eventName)` | Limpa todos os handlers de um evento |
| `clearAll()` | Limpa todos os eventos |
| `debug()` | Exibe informações de debug no console |

---

### 2. **ModalManager** (`src/utils/ModalManager.ts`)

Gerenciador centralizado de modals que previne conflitos de abertura/fechamento.

#### Características:
- ✅ **Sistema de prioridades** - Previne que modals de baixa prioridade fechem os de alta
- ✅ **Modal ativo único** - Apenas um modal pode estar ativo por vez
- ✅ **Callbacks automáticos** - Executa cleanup ao fechar
- ✅ **Integração com EventManager** - Dispara eventos globais

#### Uso:

```typescript
import { modalManager } from '../../utils/ModalManager';

// Registrar modal (normalmente no useEffect de montagem)
useEffect(() => {
  modalManager.register('my-modal', 5); // priority 5
}, []);

// Abrir modal
useEffect(() => {
  if (isOpen) {
    modalManager.open('my-modal', () => {
      // Callback executado ao fechar
      resetForm();
    });
  } else {
    modalManager.close('my-modal');
  }
}, [isOpen]);
```

#### Prioridades Sugeridas:

| Prioridade | Tipo de Modal | Exemplo |
|------------|---------------|---------|
| 0 | Informativo | Tooltips, Hints |
| 3 | Formulário simples | Login, Registro |
| 5 | Formulário de criação | CreateClueModal |
| 6 | Editor complexo | UnifiedPuzzleCreatorModal |
| 8 | Crítico | Confirmação de deleção |
| 10 | Sistema | Erro crítico, Manutenção |

#### API:

| Método | Descrição |
|--------|-----------|
| `register(id, priority)` | Registra modal com prioridade |
| `open(id, onClose?)` | Abre modal (retorna boolean de sucesso) |
| `close(id)` | Fecha modal específico |
| `closeAll()` | Fecha todos os modals |
| `isAnyOpen()` | Verifica se algum modal está aberto |
| `isOpen(id)` | Verifica se modal específico está aberto |
| `getActiveModal()` | Retorna ID do modal ativo |
| `setPriority(id, priority)` | Atualiza prioridade |
| `unregister(id)` | Remove modal do sistema |
| `debug()` | Exibe informações de debug |

---

### 3. **AudioManager** (`src/utils/AudioManager.ts`)

Gerenciador centralizado de áudio que previne race conditions na inicialização do AudioContext.

#### Características:
- ✅ **Mutex na inicialização** - Previne múltiplas instâncias de AudioContext
- ✅ **Controle de estado** - Rastreia se está inicializando/ativo
- ✅ **Cleanup garantido** - Fecha recursos corretamente
- ✅ **Timeout de espera** - Não trava se inicialização falhar

#### Uso:

```typescript
import { audioManager } from '../../utils/AudioManager';

// Inicializar (com mutex automático)
await audioManager.initialize();

// Verificar se está pronto
if (audioManager.isReady()) {
  audioManager.setVolume(0.5);
  audioManager.fadeIn(1000, 0.8);
}

// Cleanup
await audioManager.cleanup();
```

#### API:

| Método | Descrição |
|--------|-----------|
| `initialize()` | Inicializa AudioContext (com mutex) |
| `cleanup()` | Fecha todos os recursos de áudio |
| `isReady()` | Retorna se está ativo e não inicializando |
| `getState()` | Retorna 'initializing', 'active' ou 'inactive' |
| `setVolume(value)` | Define volume (0-1) |
| `fadeIn(duration, targetVolume)` | Fade in do volume |
| `fadeOut(duration)` | Fade out do volume |
| `resume()` | Resume AudioContext suspenso |
| `getAudioContext()` | Retorna AudioContext (use com cuidado) |
| `debug()` | Exibe informações de debug |

---

## 🎯 Componentes Refatorados

### ✅ SystemOverlays.tsx
- Migrado de `window.addEventListener` para `eventManager.on`
- Removidos refs de AudioContext (usa `audioManager`)
- Corrigido cleanup de intervals do decode-effect
- Event listeners sem duplicatas

### ✅ InvestigationCardModal.tsx
- Migrado de `window.dispatchEvent` para `modalManager`
- Registrado com prioridade 5
- Callback de cleanup ao fechar

### ✅ UnifiedPuzzleCreatorModal.tsx
- Migrado para `modalManager`
- Registrado com prioridade 6 (maior que modals simples)
- Reset de estado no callback de fechamento

### ✅ ConspiracyBoard.tsx
- Realtime updates com debouncing via `eventManager`
- Mutex para prevenir saves simultâneos (`isSyncing`)
- Debouncing manual de 2s entre saves
- Validações antes de apply remote update
- Botão de save desabilitado durante sync

---

## 🚨 Race Conditions Eliminadas

### Antes:
```typescript
// ❌ Múltiplos listeners podem duplicar
window.addEventListener('modal-opened', handleModalOpen);
window.addEventListener('modal-opened', handleModalOpen); // duplicata!

// ❌ Sem controle de ordem
window.dispatchEvent(new Event('modal-opened'));
window.dispatchEvent(new Event('modal-opened')); // race condition!

// ❌ AudioContext pode inicializar múltiplas vezes
const ctx = new AudioContext(); // duplicata se chamado novamente!
```

### Depois:
```typescript
// ✅ EventManager previne duplicatas automaticamente
const unsubscribe = eventManager.on('modal:opened', handleModalOpen);

// ✅ Fila garante ordem de execução
eventManager.emit('modal:opened', 'id-1');
eventManager.emit('modal:opened', 'id-2'); // enfileirado

// ✅ Mutex previne duplicatas
await audioManager.initialize(); // se já iniciando, aguarda
```

---

## 📊 Eventos Padronizados

### Eventos de Modal:
- `modal:opened` - Modal foi aberto (payload: modalId)
- `modal:closed` - Modal foi fechado (payload: modalId)
- `header:toggle` - Alterna visibilidade do header (payload: boolean)

### Eventos de Conspiracy:
- `conspiracy:remote-update` - Update remoto recebido (payload: boardData)

### Eventos Futuros Sugeridos:
- `clue:save` - Salvar pista
- `board:sync` - Sincronizar board
- `investigation:load` - Carregar investigação
- `auth:logout` - Logout do usuário

---

## 🔍 Debug

### Ver todos os eventos registrados:
```typescript
import { eventManager } from './utils/EventManager';
eventManager.debug();
```

### Ver estado dos modals:
```typescript
import { modalManager } from './utils/ModalManager';
modalManager.debug();
```

### Ver estado do áudio:
```typescript
import { audioManager } from './utils/AudioManager';
audioManager.debug();
```

---

## ⚠️ Considerações Importantes

### EventManager:
1. **Sempre use `const unsubscribe = eventManager.on(...)`** e chame no cleanup do useEffect
2. **Use debouncing** para eventos frequentes (mouse move, scroll, input)
3. **Evite emitir eventos dentro de handlers** do mesmo evento (pode causar loop)

### ModalManager:
1. **Registre modals no mount** do componente (não no open/close)
2. **Use prioridades adequadas** - modals críticos devem ter prioridade alta
3. **Sempre forneça callback de cleanup** para resetar estado

### AudioManager:
1. **Inicialize apenas após interação do usuário** (browsers bloqueiam autoplay)
2. **Sempre chame cleanup** no unmount do componente
3. **Use `isReady()` antes de usar** métodos que dependem do AudioContext

---

## 🎯 Próximos Passos

### Migração Pendente:
- [ ] CreatorHub.tsx
- [ ] Desktop.tsx
- [ ] Demais modals (CodePromptModal, InspectionModal, etc.)
- [ ] InvestigationBoard.tsx (simplificar lógica de modal tracking)

### Melhorias Futuras:
- [ ] Adicionar testes unitários para cada manager
- [ ] Criar hook customizado `useModal(id, priority)`
- [ ] Criar hook customizado `useEvent(eventName, handler)`
- [ ] Adicionar métricas de performance (tempo médio de evento)
- [ ] Persistir prioridades de modals em config

---

## 📝 Exemplos de Uso Completo

### Exemplo 1: Modal com Form

```typescript
import { modalManager } from '../../utils/ModalManager';
import { eventManager } from '../../utils/EventManager';

export default function MyFormModal({ isOpen, onClose }: Props) {
  const [formData, setFormData] = useState({});

  // Registrar modal
  useEffect(() => {
    modalManager.register('my-form-modal', 5);
  }, []);

  // Controlar abertura/fechamento
  useEffect(() => {
    if (isOpen) {
      modalManager.open('my-form-modal', () => {
        // Reset form ao fechar
        setFormData({});
      });
    } else {
      modalManager.close('my-form-modal');
    }
  }, [isOpen]);

  // Handler de save com debouncing
  const handleSave = () => {
    eventManager.emitDebounced('form:save', 300, formData);
  };

  return isOpen ? (
    <div className="modal-overlay">
      {/* ... conteúdo ... */}
    </div>
  ) : null;
}
```

### Exemplo 2: Realtime Sync com Mutex

```typescript
import { eventManager } from '../../utils/EventManager';

export default function RealtimeComponent({ id }: Props) {
  const [isSyncing, setIsSyncing] = useState(false);

  // Subscribe a updates remotos
  useEffect(() => {
    const channel = supabase.channel(`updates-${id}`)
      .on('postgres_changes', {...}, (payload) => {
        // Debounce de 500ms
        eventManager.emitDebounced('data:update', 500, payload.new);
      })
      .subscribe();

    const unsubscribe = eventManager.on('data:update', (data) => {
      if (!isSyncing) {
        handleUpdate(data);
      }
    });

    return () => {
      supabase.removeChannel(channel);
      unsubscribe();
    };
  }, [id, isSyncing]);

  const handleSave = async () => {
    if (isSyncing) {
      alert('Sync em andamento...');
      return;
    }

    setIsSyncing(true);
    try {
      await saveData();
    } finally {
      setIsSyncing(false);
    }
  };

  return <button onClick={handleSave} disabled={isSyncing}>Save</button>;
}
```

---

## 📚 Referências

- [MDN: AudioContext](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext)
- [React: useEffect cleanup](https://react.dev/reference/react/useEffect#cleanup)
- [Pattern: Singleton](https://refactoring.guru/design-patterns/singleton)
- [Pattern: Observer](https://refactoring.guru/design-patterns/observer)

---

**Última atualização:** 2026-01-01
**Versão:** 1.0.0
