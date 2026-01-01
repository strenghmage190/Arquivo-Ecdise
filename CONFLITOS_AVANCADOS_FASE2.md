# 🚨 CONFLITOS AVANÇADOS - FASE 2

Análise profunda revelou 5 novos conflitos que interferem com a estabilidade do sistema.

---

## 1️⃣ RACE CONDITION NO CONSPIRACY BOARD ⚠️
**Severidade**: 🔴 CRÍTICO

### Problema:
```tsx
// ConspiracyBoard.tsx - linha 90
const unsubscribe = eventManager.on('conspiracy:remote-update', (newData: any) => {
  if (isSyncing) {
    console.warn('[ConspiracyBoard] Sync in progress, queuing update');
    return; // ❌ PROBLEM: Update perdida, nunca será reprocessada
  }
  setRemoteUpdate(newData);
});
```

**Conflito**: Quando `isSyncing=true`, a atualização remota é ignorada e **nunca** será processada de novo. Resultado: Inconsistência entre local e servidor.

### Solução:
```tsx
// ✅ Usar EventManager com fila (já implementada!)
const unsubscribe = eventManager.on('conspiracy:remote-update', (newData: any) => {
  if (isSyncing) {
    // Requeue a atualização usando EventManager queue
    console.warn('[ConspiracyBoard] Sync in progress, requeuing update');
    eventManager.emit('conspiracy:remote-update:queued', newData);
    return;
  }
  setRemoteUpdate(newData);
});

// Processar fila quando sync termina
useEffect(() => {
  if (!isSyncing && pendingUpdateRef.current) {
    const pending = pendingUpdateRef.current;
    pendingUpdateRef.current = null;
    setRemoteUpdate(pending);
  }
}, [isSyncing]);
```

---

## 2️⃣ MEMORY LEAK EM INVESTIGATION BOARD 💾
**Severidade**: 🟠 ALTO

### Problema:
```tsx
// InvestigationBoard.tsx - linha 559
useEffect(() => {
  // ... setup channels
  return () => {
    try {
      channels.forEach(ch => { try { ch.unsubscribe(); } catch (e) {} });
    } catch (e) { }
  };
}, [investigationId]);
```

**Conflito**: 
1. `saveTimeouts.current[id]` nunca é limpo no cleanup
2. `saveQueueRef.current` pode acumular indefinidamente
3. `positionFrameRef` e `originFrameRef` não estão no cleanup

### Solução:
```tsx
useEffect(() => {
  return () => {
    // Limpar todos os timeouts pendentes
    Object.values(saveTimeouts.current).forEach(timeout => {
      if (timeout) clearTimeout(timeout as any);
    });
    saveTimeouts.current = {};
    
    // Limpar fila de saves
    saveQueueRef.current.clear();
    
    // Limpar animation frames
    if (positionFrameRef.current !== null) {
      cancelAnimationFrame(positionFrameRef.current);
    }
    if (originFrameRef.current !== null) {
      cancelAnimationFrame(originFrameRef.current);
    }
    
    // Unsubscribe channels
    channels.forEach(ch => { try { ch.unsubscribe(); } catch (e) {} });
  };
}, [investigationId]);
```

---

## 3️⃣ DEBOUNCE TIMEOUT COLLISION 🔄
**Severidade**: 🟠 ALTO

### Problema:
```tsx
// GlitchPuzzleSolver.tsx - linha 97
useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedFreq(freq);
    setDebouncedShift(shift);
    setDebouncedChroma(chroma);
  }, 50);
  return () => clearTimeout(timer);
}, [freq, shift, chroma]);

// ❌ Problema: 3 states sendo atualizados juntos
// Se um slider muda enquanto outro está sendo debounced,
// podem ficar dessincronizados
```

**Conflito**: Múltiplos debounces para valores relacionados causam dessincronização.

### Solução:
```tsx
// ✅ Usar um único debounce para todos os 3 valores
const [debouncedConfig, setDebouncedConfig] = useState({ freq, shift, chroma });

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedConfig({ freq, shift, chroma });
  }, 50);
  return () => clearTimeout(timer);
}, [freq, shift, chroma]);
```

---

## 4️⃣ WAVESURFER CLEANUP NÃO IMPLEMENTADO 🎵
**Severidade**: 🟡 MÉDIO

### Problema:
```tsx
// AdvancedAudioLab.tsx - linha 141
useEffect(() => {
  // ... setup wavesurfer
  return () => {
    ws.un('ready', onReady);
    ws.un('audioprocess', onProcess);
    ws.un('finish', onFinish);
    try {
      const r = ws.destroy();
      if (r && typeof r.then === 'function') r.catch(() => {});
    } catch (e) {}
  };
}, [baseSrc]);

// ❌ Problema: prevLocalHiddenRef nunca é limpo no cleanup principal
```

Veja [AdvancedAudioLab.tsx#L141](AdvancedAudioLab.tsx#L141)

**Conflito**: A URL revogada separadamente nunca é resetada quando wavesurfer é destruído.

### Solução:
```tsx
// ✅ Unificar cleanup
useEffect(() => {
  return () => {
    // Revoke URL primeiro
    if (prevLocalHiddenRef.current) {
      try { URL.revokeObjectURL(prevLocalHiddenRef.current); } catch (e) {}
      prevLocalHiddenRef.current = null;
    }
    
    // Depois cleanup wavesurfer
    ws.un('ready', onReady);
    ws.un('audioprocess', onProcess);
    ws.un('finish', onFinish);
    try {
      const r = ws.destroy();
      if (r && typeof r.then === 'function') r.catch(() => {});
    } catch (e) {}
  };
}, [baseSrc]);
```

---

## 5️⃣ MODAL STACK CONFLICTS - MÚLTIPLAS ABAS CRIADAS 📋
**Severidade**: 🟠 ALTO

### Problema:
```tsx
// CreateClueModal.tsx - linha 357
// Cleanup URL refs
const urlsRef = React.useRef<string[]>([]);

React.useEffect(() => {
  urlsRef.current = [previewUrl, videoPreviewUrl, audioBasePreview, ...].filter(Boolean) as string[];
}, [previewUrl, videoPreviewUrl, audioBasePreview, ...]);

useEffect(() => {
  return () => {
    urlsRef.current.forEach((u) => { try { URL.revokeObjectURL(u); } catch (err) {} });
  };
}, []);

// ❌ Problema:
// 1. urlsRef é atualizada a cada render mas cleanup só roda 1x no unmount
// 2. Se modal fecha enquanto temos 5 URLs em cache, vamos revogar tudo
// 3. Se modal reabre ANTES do cleanup rodar (cleanup é async), teremos leak
```

Veja [CreateClueModal.tsx#L357](CreateClueModal.tsx#L357)

**Conflito**: Cleanup URLs acontece apenas no unmount, não durante operações.

### Solução:
```tsx
// ✅ Limpar URLs proativamente
const urlsRef = React.useRef<Set<string>>(new Set());

// Registrar nova URL
const registerUrl = (url: string) => {
  urlsRef.current.add(url);
};

// Revogar URL imediatamente quando não mais necessária
const revokeUrl = (url: string) => {
  if (url && urlsRef.current.has(url)) {
    try { URL.revokeObjectURL(url); } catch (err) {}
    urlsRef.current.delete(url);
  }
};

// Ao mudar preview URL
useEffect(() => {
  if (previewUrl) {
    registerUrl(previewUrl);
  }
  return () => {
    revokeUrl(previewUrl);
  };
}, [previewUrl]);

// Cleanup final no unmount
useEffect(() => {
  return () => {
    urlsRef.current.forEach(url => {
      try { URL.revokeObjectURL(url); } catch (err) {}
    });
    urlsRef.current.clear();
  };
}, []);
```

---

## 📊 RESUMO COMPARATIVO

| # | Conflito | Tipo | Impact | Fix Complexity |
|---|----------|------|--------|-----------------|
| 1 | Race Condition Conspiracy | Lógica | Data Loss | ⭐⭐ |
| 2 | Memory Leak Investigation | Memory | Crash | ⭐⭐⭐ |
| 3 | Debounce Desync | State | Misalignment | ⭐ |
| 4 | Wavesurfer Cleanup | Resource | Leak | ⭐ |
| 5 | Modal URL Cleanup | Resource | Leak | ⭐⭐ |

---

## ✅ PRÓXIMOS PASSOS

1. **Prioridade 1**: Conspiracy Board race condition (evita data loss)
2. **Prioridade 2**: Memory leaks (evita crashes)
3. **Prioridade 3**: Debounce sync (melhora UX)
4. **Prioridade 4**: Cleanup de recursos

---

**Status**: 🔍 IDENTIFICADO | Aguardando aprovação para implementação
