/**
 * 🎮 CONFIG DE EXIBIÇÃO - PUZZLE & METADADOS
 * 
 * Controla o que é visível ou não no jogo/investigação.
 * Você pode mudar isso aqui para decidir o que aparece.
 */

export interface DisplayConfig {
  // ============ GLITCH PUZZLE ============
  puzzle: {
    // Mostra as instruções de como acessar/resolver o puzzle?
    showAccessInstructions: boolean;
    
    // Mostra a DICA?
    showHint: boolean;
    
    // Quando resolvido, mostra os PARÂMETROS CORRETOS? 
    // ⚠️ ATENÇÃO: Isso entrega a solução!
    showCorrectAnswerWhenSolved: boolean;
    
    // Mostra o código de recompensa?
    showRewardCode: boolean;
    
    // Mostra o "LOG DE RECUPERAÇÃO" (terminal)?
    showLogs: boolean;
  };

  // ============ FILE PROPERTIES (METADADOS DE ARQUIVO) ============
  fileProperties: {
    // Mostra o tipo de arquivo?
    showFileType: boolean;
    
    // Mostra o tamanho?
    showSize: boolean;
    
    // Mostra a câmera que tirou a foto?
    showCameraModel: boolean;
    
    // Mostra a data?
    showDate: boolean;
    
    // Mostra coordenadas GPS?
    showGPS: boolean;
    
    // Mostra o owner/dono?
    showOwner: boolean;
    
    // Mostra os metadados HEX/Nota Técnica?
    showHexComment: boolean;
    
    // Mostra carimbo/stamp?
    showStamp: boolean;
    
    // Mostra link externo?
    showExternalLink: boolean;
    
    // Mostra status de bloqueio?
    showLockStatus: boolean;
    
    // Mostra informações de pessoa (dossiê)?
    showPersonInfo: boolean;
  };

  // ============ VISUAL & MÍDIA ============
  media: {
    // Mostra dados térmicos?
    showThermalData: boolean;
    
    // Mostra camada UV?
    showUVLayer: boolean;
    
    // Mostra overlay de filtro?
    showFilterOverlay: boolean;
    
    // Mostra player de vídeo?
    showVideoPlayer: boolean;
    
    // Mostra player de áudio?
    showAudioPlayer: boolean;
    
    // Mostra áudio oculto (após resolver)?
    showHiddenAudio: boolean;
    
    // Mostra conversas de chat?
    showChatData: boolean;
  };

  // ============ CIFRAS & FRAGMENTOS ============
  cipher: {
    // Mostra documentos fragmentados?
    showShredded: boolean;
    
    // Mostra texto cifrado?
    showCipherText: boolean;
    
    // Mostra texto real/decifrado?
    showRealText: boolean;
    
    // Mostra configuração de fragmentação?
    showShredConfig: boolean;
  };

  // ============ MEGA CLUE ============
  megaClue: {
    // Mostra as dicas/pistas?
    showHints: boolean;
    
    // Mostra a resposta final?
    showAnswer: boolean;
    
    // Mostra o progresso (quantas pistas resolvidas)?
    showProgress: boolean;
  };
}

/**
 * ⚙️ CONFIGURAÇÃO PADRÃO
 * 
 * Mude os valores aqui para:
 * - true = MOSTRA esse elemento
 * - false = ESCONDE esse elemento
 */
export const defaultDisplayConfig: DisplayConfig = {
  puzzle: {
    showAccessInstructions: true,   // Mostra "COMO ACESSAR"
    showHint: true,                  // Mostra a dica
    showCorrectAnswerWhenSolved: false, // ⚠️ NÃO mostra os valores corretos (seguro!)
    showRewardCode: true,            // Mostra o código de recompensa desbloqueado
    showLogs: true,                  // Mostra o terminal de logs
  },
  
  fileProperties: {
    showFileType: true,              // Mostra "Image File (JPEG)"
    showSize: true,                  // Mostra tamanho do arquivo
    showCameraModel: true,           // Mostra câmera
    showDate: true,                  // Mostra data
    showGPS: true,                   // Mostra GPS (pode ser importante para investigação)
    showOwner: true,                 // Mostra dono
    showHexComment: false,           // NÃO mostra hex/nota técnica por padrão
    showStamp: true,                 // Mostra carimbo
    showExternalLink: true,          // Mostra links externos
    showLockStatus: true,            // Mostra se está bloqueado
    showPersonInfo: true,            // Mostra informações de pessoa
  },
  
  media: {
    showThermalData: false,          // NÃO mostra dados térmicos por padrão
    showUVLayer: false,              // NÃO mostra camada UV por padrão
    showFilterOverlay: true,         // Mostra overlay de filtro
    showVideoPlayer: true,           // Mostra player de vídeo
    showAudioPlayer: true,           // Mostra player de áudio
    showHiddenAudio: false,          // NÃO mostra áudio oculto por padrão
    showChatData: true,              // Mostra conversas de chat
  },
  
  cipher: {
    showShredded: true,              // Mostra documentos fragmentados
    showCipherText: true,            // Mostra texto cifrado
    showRealText: false,             // ⚠️ NÃO mostra texto real por padrão
    showShredConfig: false,          // NÃO mostra config de fragmentação
  },
  
  megaClue: {
    showHints: true,                 // Mostra dicas
    showAnswer: false,               // NÃO mostra a resposta
    showProgress: true,              // Mostra progresso
  },
};

/**
 * Hook para carregar a config (pode ser do localStorage, banco, etc)
 */
export function useDisplayConfig(): DisplayConfig {
  // TODO: Você pode carregar isso do localStorage ou do Supabase
  // Por enquanto, usa a padrão
  
  try {
    const stored = localStorage.getItem('displayConfig');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Erro ao carregar displayConfig do localStorage:', e);
  }

  return defaultDisplayConfig;
}

/**
 * Função para salvar a config
 */
export function saveDisplayConfig(config: DisplayConfig): void {
  try {
    const data = JSON.stringify(config);
    localStorage.setItem('displayConfig', data);
    // Also persist to IndexedDB for more robust storage on larger payloads
    idbSet('displayConfig', data).catch((err) => console.warn('IDB save failed', err));
    console.log('✅ Config de exibição salva');
  } catch (e) {
    console.error('❌ Erro ao salvar displayConfig:', e);
  }
}

// ----------------------
// Minimal IndexedDB helpers (no external deps)
// ----------------------
function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    try {
      const req = indexedDB.open('site-investigacao', 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } catch (err) {
      reject(err);
    }
  });
}

async function idbGet(key: string): Promise<string | null> {
  try {
    const db = await openIDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('kv', 'readonly');
      const store = tx.objectStore('kv');
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    return null;
  }
}

async function idbSet(key: string, value: string): Promise<void> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('kv', 'readwrite');
    const store = tx.objectStore('kv');
    const req = store.put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Initialize the displayConfig cache from IndexedDB and seed localStorage.
 * Call this early on app startup to make the synchronous `useDisplayConfig()` pick up
 * previously stored values without waiting for async loads later.
 */
export async function initDisplayConfigCache(): Promise<void> {
  try {
    const stored = await idbGet('displayConfig');
    if (stored) {
      try {
        // Seed localStorage for synchronous reads
        localStorage.setItem('displayConfig', stored);
      } catch (e) {
        console.warn('Falha ao semear localStorage com config do IDB', e);
      }
    }
  } catch (e) {
    // Fail silently — IndexedDB isn't critical
    console.warn('initDisplayConfigCache failed:', e);
  }
}
