# 🚀 Guia Rápido de Migração

## Para Desenvolvedores: Como Migrar Componentes Existentes

Este guia mostra como migrar componentes antigos para usar os novos managers centralizados.

---

## 📌 Quando Migrar?

Migre se seu componente:
- ✅ Usa `window.addEventListener` / `window.removeEventListener`
- ✅ Usa `window.dispatchEvent(new Event(...))`
- ✅ Cria AudioContext diretamente
- ✅ É um modal que precisa gerenciar estado open/close
- ✅ Tem problemas com event listeners duplicados
- ✅ Precisa de debouncing em eventos

---

## 🔄 Migração Passo a Passo

### **1. Migrar Event Listeners**

#### ❌ Antes:
```typescript
useEffect(() => {
  const handleClick = () => console.log('clicked');
  window.addEventListener('click', handleClick);
  
  return () => {
    window.removeEventListener('click', handleClick);
  };
}, []);
```

#### ✅ Depois:
```typescript
import { eventManager } from '../../utils/EventManager';

useEffect(() => {
  const handleClick = () => console.log('clicked');
  const unsubscribe = eventManager.on('click', handleClick);
  
  return unsubscribe; // cleanup automático
}, []);
```

**Ganhos:**
- Sem duplicatas automático
- Cleanup simplificado
- Fila de execução sequencial

---

### **2. Migrar Dispatch de Eventos**

#### ❌ Antes:
```typescript
window.dispatchEvent(new Event('modal-opened'));
window.dispatchEvent(new CustomEvent('data-updated', { detail: newData }));
```

#### ✅ Depois:
```typescript
import { eventManager } from '../../utils/EventManager';

eventManager.emit('modal:opened');
eventManager.emit('data:updated', newData);
```

**Ganhos:**
- Nomenclatura padronizada (`:` em vez de `-`)
- Payload como argumento direto (sem `detail`)
- Fila de execução

---

### **3. Migrar Modals**

#### ❌ Antes:
```typescript
export default function MyModal({ isOpen, onClose }: Props) {
  useEffect(() => {
    if (isOpen) {
      window.dispatchEvent(new Event('modal-opened'));
    } else {
      window.dispatchEvent(new Event('modal-closed'));
    }
  }, [isOpen]);

  const handleClose = () => {
    resetState();
    onClose();
  };

  return isOpen ? (
    <div className="modal-overlay" onClick={handleClose}>
      {/* conteúdo */}
    </div>
  ) : null;
}
```

#### ✅ Depois:
```typescript
import { modalManager } from '../../utils/ModalManager';

export default function MyModal({ isOpen, onClose }: Props) {
  // 1. Registrar modal (uma vez)
  useEffect(() => {
    modalManager.register('my-modal', 5); // priority
  }, []);

  // 2. Gerenciar abertura/fechamento
  useEffect(() => {
    if (isOpen) {
      modalManager.open('my-modal', () => {
        // Callback executado automaticamente ao fechar
        resetState();
      });
    } else {
      modalManager.close('my-modal');
    }
  }, [isOpen]);

  return isOpen ? (
    <div className="modal-overlay" onClick={onClose}>
      {/* conteúdo */}
    </div>
  ) : null;
}
```

**Ganhos:**
- Sistema de prioridades (previne conflitos)
- Callback de cleanup automático
- Modal ativo único
- Eventos globais automáticos

**Prioridades Sugeridas:**
```typescript
0-2  = Tooltips, hints
3-4  = Forms simples
5-7  = Editors, criação
8-9  = Confirmações críticas
10+  = Erros do sistema
```

---

### **4. Migrar AudioContext**

#### ❌ Antes:
```typescript
const audioCtxRef = useRef<AudioContext | null>(null);

const setupAudio = () => {
  if (audioCtxRef.current) return; // ❌ não é suficiente
  const ctx = new AudioContext();
  audioCtxRef.current = ctx;
  // ...
};

const teardownAudio = () => {
  if (audioCtxRef.current) {
    audioCtxRef.current.close();
    audioCtxRef.current = null;
  }
};

useEffect(() => {
  setupAudio();
  return () => teardownAudio();
}, []);
```

#### ✅ Depois:
```typescript
import { audioManager } from '../../utils/AudioManager';

useEffect(() => {
  // Inicializar apenas se necessário
  // audioManager.initialize(); // descomente se precisar de áudio
  
  return () => {
    audioManager.cleanup();
  };
}, []);

// Usar em handlers
const handleClick = async () => {
  await audioManager.initialize();
  if (audioManager.isReady()) {
    audioManager.setVolume(0.5);
    audioManager.fadeIn(1000);
  }
};
```

**Ganhos:**
- Mutex automático (previne duplicatas)
- Controle de estado
- Cleanup garantido
- Timeout de espera

---

### **5. Adicionar Debouncing**

#### ❌ Antes (sem debouncing):
```typescript
const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
  saveData(e.target.value); // ❌ salva a cada tecla
};
```

#### ✅ Depois (com debouncing):
```typescript
import { eventManager } from '../../utils/EventManager';

// Opção 1: Usar EventManager
const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
  eventManager.emitDebounced('data:save', 300, e.target.value);
};

useEffect(() => {
  const unsubscribe = eventManager.on('data:save', (value) => {
    saveData(value);
  });
  return unsubscribe;
}, []);

// Opção 2: Debouncing manual (para operações assíncronas)
const lastCallRef = useRef<number>(0);

const handleSave = async () => {
  const now = Date.now();
  const timeSinceLast = now - lastCallRef.current;
  
  if (timeSinceLast < 1000) {
    console.warn('Save too frequent, wait', 1000 - timeSinceLast, 'ms');
    return;
  }
  
  lastCallRef.current = now;
  await saveData();
};
```

**Ganhos:**
- Reduz chamadas excessivas
- Melhora performance
- Evita race conditions

---

### **6. Adicionar Mutex (para operações críticas)**

#### ❌ Antes (sem mutex):
```typescript
const handleSave = async () => {
  await saveData(); // ❌ pode ser chamado múltiplas vezes
};
```

#### ✅ Depois (com mutex):
```typescript
const [isSaving, setIsSaving] = useState(false);

const handleSave = async () => {
  if (isSaving) {
    console.warn('Save already in progress');
    return;
  }

  setIsSaving(true);
  try {
    await saveData();
  } catch (error) {
    console.error('Save failed:', error);
  } finally {
    setIsSaving(false);
  }
};

// No JSX
<button onClick={handleSave} disabled={isSaving}>
  {isSaving ? 'Salvando...' : 'Salvar'}
</button>
```

**Ganhos:**
- Previne chamadas simultâneas
- Feedback visual para usuário
- Tratamento de erro garantido

---

## 🎯 Exemplos Completos

### Exemplo 1: Modal com Form e Debouncing

```typescript
import { modalManager } from '../../utils/ModalManager';
import { eventManager } from '../../utils/EventManager';

export default function EditUserModal({ isOpen, onClose, userId }: Props) {
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Registrar modal
  useEffect(() => {
    modalManager.register('edit-user-modal', 5);
  }, []);

  // Controlar abertura/fechamento
  useEffect(() => {
    if (isOpen) {
      modalManager.open('edit-user-modal', () => {
        setFormData({}); // reset ao fechar
      });
    } else {
      modalManager.close('edit-user-modal');
    }
  }, [isOpen]);

  // Auto-save com debouncing
  useEffect(() => {
    if (!isOpen) return;
    
    eventManager.emitDebounced('user:autosave', 2000, formData);
  }, [formData, isOpen]);

  // Handler de auto-save
  useEffect(() => {
    const unsubscribe = eventManager.on('user:autosave', async (data) => {
      if (isSaving) return;
      
      setIsSaving(true);
      try {
        await saveUser(userId, data);
        console.log('Auto-saved');
      } finally {
        setIsSaving(false);
      }
    });
    
    return unsubscribe;
  }, [userId, isSaving]);

  const handleSubmit = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      await saveUser(userId, formData);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return isOpen ? (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Editar Usuário {isSaving && '💾'}</h2>
        {/* ... form fields ... */}
        <button onClick={handleSubmit} disabled={isSaving}>
          {isSaving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  ) : null;
}
```

### Exemplo 2: Realtime Sync com Mutex e Debouncing

```typescript
import { eventManager } from '../../utils/EventManager';

export default function RealtimeEditor({ documentId }: Props) {
  const [content, setContent] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const lastSaveRef = useRef<number>(0);

  // Subscribe a updates remotos
  useEffect(() => {
    const channel = supabase
      .channel(`document-${documentId}`)
      .on('postgres_changes', {...}, (payload) => {
        // Debounce de 500ms
        eventManager.emitDebounced('document:update', 500, payload.new);
      })
      .subscribe();

    const unsubscribe = eventManager.on('document:update', (data) => {
      if (!isSyncing) {
        setContent(data.content);
      }
    });

    return () => {
      supabase.removeChannel(channel);
      unsubscribe();
    };
  }, [documentId, isSyncing]);

  // Save com mutex e debouncing
  const handleSave = async () => {
    // Mutex
    if (isSyncing) {
      alert('Sync em andamento...');
      return;
    }

    // Debouncing
    const now = Date.now();
    if (now - lastSaveRef.current < 2000) {
      const wait = Math.ceil((2000 - (now - lastSaveRef.current)) / 1000);
      alert(`Aguarde ${wait}s antes de salvar novamente`);
      return;
    }

    lastSaveRef.current = now;
    setIsSyncing(true);

    try {
      await saveDocument(documentId, content);
      alert('Salvo!');
    } catch (error) {
      console.error('Save failed:', error);
      alert('Erro ao salvar');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div>
      <textarea value={content} onChange={(e) => setContent(e.target.value)} />
      <button onClick={handleSave} disabled={isSyncing}>
        {isSyncing ? '⏳ Salvando...' : '💾 Salvar'}
      </button>
    </div>
  );
}
```

---

## 📋 Checklist de Migração

Ao migrar um componente, verifique:

- [ ] Importou os managers necessários
- [ ] Substituiu `window.addEventListener` por `eventManager.on`
- [ ] Substituiu `window.dispatchEvent` por `eventManager.emit`
- [ ] Modals registrados com `modalManager.register`
- [ ] Modals usando `modalManager.open/close`
- [ ] AudioContext substituído por `audioManager`
- [ ] Cleanup implementado (retorno de `unsubscribe`)
- [ ] Debouncing adicionado onde necessário
- [ ] Mutex adicionado em operações críticas
- [ ] Testado manualmente (open/close, events, etc.)
- [ ] Sem erros de TypeScript
- [ ] Sem warnings no console

---

## ⚠️ Armadilhas Comuns

### 1. **Esquecer de registrar modal**
```typescript
// ❌ ERRADO
useEffect(() => {
  if (isOpen) {
    modalManager.open('my-modal'); // não vai funcionar!
  }
}, [isOpen]);

// ✅ CORRETO
useEffect(() => {
  modalManager.register('my-modal', 5);
}, []);

useEffect(() => {
  if (isOpen) {
    modalManager.open('my-modal');
  }
}, [isOpen]);
```

### 2. **Não retornar função de cleanup**
```typescript
// ❌ ERRADO
useEffect(() => {
  eventManager.on('my:event', handler);
  // esqueceu de retornar unsubscribe!
}, []);

// ✅ CORRETO
useEffect(() => {
  const unsubscribe = eventManager.on('my:event', handler);
  return unsubscribe;
}, []);
```

### 3. **Emitir eventos dentro de handlers do mesmo evento**
```typescript
// ❌ ERRADO (pode causar loop infinito)
useEffect(() => {
  const unsubscribe = eventManager.on('data:update', (data) => {
    eventManager.emit('data:update', processData(data)); // ⚠️ loop!
  });
  return unsubscribe;
}, []);

// ✅ CORRETO
useEffect(() => {
  const unsubscribe = eventManager.on('data:update', (data) => {
    const processed = processData(data);
    eventManager.emit('data:processed', processed); // evento diferente
  });
  return unsubscribe;
}, []);
```

### 4. **Não verificar mutex antes de operações**
```typescript
// ❌ ERRADO
const handleSave = async () => {
  setIsSaving(true);
  await save(); // mas e se já está salvando?
  setIsSaving(false);
};

// ✅ CORRETO
const handleSave = async () => {
  if (isSaving) return; // verifica primeiro!
  
  setIsSaving(true);
  try {
    await save();
  } finally {
    setIsSaving(false);
  }
};
```

---

## 🔍 Debug

Se algo não funcionar:

```typescript
// Ver eventos registrados
import { eventManager } from './utils/EventManager';
eventManager.debug();

// Ver modals registrados
import { modalManager } from './utils/ModalManager';
modalManager.debug();

// Ver estado do áudio
import { audioManager } from './utils/AudioManager';
audioManager.debug();
```

---

## 📚 Documentação Completa

- [MANAGERS_SYSTEM.md](./MANAGERS_SYSTEM.md) - API completa e exemplos
- [REFATORACAO_RACE_CONDITIONS.md](./REFATORACAO_RACE_CONDITIONS.md) - Resumo da refatoração

---

## ❓ Perguntas Frequentes

**Q: Preciso migrar todos os componentes de uma vez?**  
A: Não! Os managers são compatíveis com código antigo. Migre gradualmente.

**Q: E se eu precisar usar window.addEventListener para eventos nativos do DOM?**  
A: Use normalmente! EventManager é para eventos customizados da aplicação.

**Q: Posso ter múltiplos handlers para o mesmo evento?**  
A: Sim! EventManager suporta múltiplos handlers (executados em ordem).

**Q: O que acontece se dois modals tiverem a mesma prioridade?**  
A: O primeiro a abrir fica ativo. O segundo é bloqueado.

**Q: Posso mudar a prioridade de um modal dinamicamente?**  
A: Sim! Use `modalManager.setPriority('modal-id', novaPrioridade)`.

---

**Última atualização:** 2026-01-01
