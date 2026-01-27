import React, { useEffect, useState, useRef } from 'react';
import { Excalidraw, MainMenu, WelcomeScreen } from '@excalidraw/excalidraw';
import { fetchCards } from '../../api/investigations';
import { fetchConspiracyBoard, saveConspiracyBoard } from '../../api/whiteboard';
import { supabase } from '../../supabaseClient';
import { eventManager } from '../../utils/EventManager';
import { useWindowSize } from '../../hooks/useWindowSize';
import './ConspiracyBoard.css';

interface Props {
  investigationId: string;
  onClose: () => void;
}

export default function ConspiracyBoard({ investigationId, onClose }: Props) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any | null>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [remoteUpdate, setRemoteUpdate] = useState<any | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const { width: windowWidth, height: windowHeight } = useWindowSize();
  
  // ✅ TODOS os Refs declarados no topo do componente (fora de useEffect)
  const lastSaveTimeRef = useRef<number>(0);
  const pendingUpdateRef = useRef<any>(null);
  const isInitialLoad = useRef(true);
  
  // ✅ Ref para o contêiner do Excalidraw
  const excalidrawContainerRef = useRef<HTMLDivElement>(null);

  // Função auxiliar para aplicar dados ao Excalidraw com segurança
  const applyToScene = (data: any) => {
    if (!excalidrawAPI) return;
    try {
      excalidrawAPI.updateScene({
        elements: data.elements || [],
        appState: data.appState || {},
        commitToHistory: true
      });
      if (data.files) {
        const filesArray = Object.values(data.files || {});
        if (filesArray.length) excalidrawAPI.addFiles(filesArray);
      }
    } catch (e) {
      console.error("[ConspiracyBoard] Erro ao aplicar cena:", e);
    }
  };

  // 1. Carregar dados iniciais (Cards e Board)
  useEffect(() => {
    let mounted = true;
    async function loadInitialData() {
      setLoading(true);
      try {
        const [boardData, cardsData] = await Promise.all([
          fetchConspiracyBoard(investigationId),
          fetchCards(investigationId)
        ]);
        
        if (!mounted) return;
        setCards(cardsData || []);

        if (boardData && excalidrawAPI) {
          applyToScene(boardData);
        }
      } catch (e) {
        console.error("[ConspiracyBoard] Erro ao carregar dados iniciais:", e);
      }
      if (mounted) setLoading(false);
    }
    
    if (excalidrawAPI) loadInitialData();
    return () => { mounted = false; };
  }, [investigationId, excalidrawAPI]);

  // 2. Realtime: Ouvir mudanças de outros jogadores
  useEffect(() => {
    let mounted = true;
    const channel = supabase
      .channel(`board:${investigationId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'investigations', 
        filter: `id=eq.${investigationId}` 
      }, (payload: any) => {
        if (!mounted) return;
        const newData = payload.new?.conspiracy_board_data;
        if (!newData) return;

        console.log('[ConspiracyBoard] Remote update received');
        
        // Se estamos salvando no momento, enfileiramos a atualização
        if (isSyncing) {
          console.warn('[ConspiracyBoard] Sync em progresso, enfileirando atualização');
          pendingUpdateRef.current = newData;
        } else {
          setRemoteUpdate(newData);
        }
      })
      .subscribe();

    return () => {
      mounted = false;
      try { supabase.removeChannel(channel); } catch (e) {}
    };
  }, [investigationId, isSyncing]);

  // 3. Salvar o Quadro para o Grupo
  const handleSave = async () => {
    if (!excalidrawAPI) {
      console.warn('[ConspiracyBoard] Não é possível salvar: excalidrawAPI não está pronto');
      return;
    }

    // Mutex: previne saves simultâneos
    if (isSyncing) {
      console.warn('[ConspiracyBoard] Save já em progresso');
      alert('Sincronização já em andamento...');
      return;
    }

    // Debouncing: previne saves muito frequentes (mínimo 3s entre saves)
    const now = Date.now();
    const timeSinceLastSave = now - lastSaveTimeRef.current;
    if (timeSinceLastSave < 3000) {
      const waitTime = Math.ceil((3000 - timeSinceLastSave) / 1000);
      console.warn('[ConspiracyBoard] Save muito frequente, aguarde', waitTime, 's');
      alert(`Aguarde ${waitTime}s antes de sincronizar novamente`);
      return;
    }

    setIsSyncing(true);
    lastSaveTimeRef.current = now;

    try {
      const elements = excalidrawAPI.getSceneElements?.() || [];
      const appState = excalidrawAPI.getAppState?.() || {};
      const files = excalidrawAPI.getFiles?.() || {};
      
      console.log('[ConspiracyBoard] Salvando...', { elements: elements.length, files: Object.keys(files).length });
      await saveConspiracyBoard(investigationId, elements, appState, files);
      
      console.log('[ConspiracyBoard] Save bem-sucedido');
      alert('Quadro Sincronizado com o Grupo!');
      
      // Se algo chegou enquanto salvávamos, limpa o aviso
      pendingUpdateRef.current = null;
    } catch (e) {
      console.error('[ConspiracyBoard] Save falhou:', e);
      alert('Falha ao sincronizar quadro. Veja console.');
    } finally {
      setIsSyncing(false);
    }
  };

  // 4. Aplicar atualização remota (o jogador escolhe quando)
  const applyRemoteUpdate = () => {
    if (!remoteUpdate || !excalidrawAPI) {
      console.warn('[ConspiracyBoard] Não é possível aplicar atualização remota: dados ausentes');
      return;
    }

    if (isSyncing) {
      console.warn('[ConspiracyBoard] Não é possível aplicar update: sync em progresso');
      alert('Aguarde a sincronização atual terminar');
      return;
    }

    try {
      console.log('[ConspiracyBoard] Aplicando atualização remota');
      applyToScene(remoteUpdate);
      setRemoteUpdate(null);
      alert('Atualização remota aplicada com sucesso.');
    } catch (e) { 
      console.error('[ConspiracyBoard] Erro ao aplicar atualização remota:', e); 
      alert('Falha ao aplicar atualização remota. Veja console.'); 
    }
  };

  const dismissRemoteUpdate = () => { setRemoteUpdate(null); };

  // 🎯 NOVA: Gera ícones de metadados (emojis) para o rodapé do card
  const createMetadataIcons = (card: any, cardX: number, cardY: number, cardHeight: number, groupId: string): any[] => {
    const icons: any[] = [];
    const baseY = cardY + cardHeight - 25; // Posição do rodapé
    let iconX = cardX + 10; // Primeira ícone a 10px do lado esquerdo
    const iconSpacing = 25; // Espaçamento entre ícones
    
    // Mapeamento de metadados para emojis
    const metadata = [
      { key: 'locked', emoji: '🔒', label: 'Bloqueado' },
      { key: 'hasAudio', emoji: '🔊', label: 'Áudio' },
      { key: 'hasVideo', emoji: '📹', label: 'Vídeo' },
      { key: 'hasUV', emoji: '🔦', label: 'UV' },
      { key: 'hasRecord', emoji: '📄', label: 'Registro' },
      { key: 'hasChat', emoji: '💬', label: 'Chat' },
      { key: 'hasExternalLink', emoji: '🔗', label: 'Link' },
    ];
    
    // Iteração pelos metadados e criação de elementos de texto para ícones
    metadata.forEach((meta) => {
      if (card[meta.key]) {
        const iconElement = {
          id: `icon-${meta.key}-${groupId}`,
          type: "text" as const,
          x: iconX,
          y: baseY,
          width: 20,
          height: 20,
          text: meta.emoji,
          fontSize: 14,
          fontFamily: 1,
          textAlign: "center" as const,
          verticalAlign: "middle" as const,
          strokeColor: "#ffd700",
          seed: Math.floor(Math.random() * 100000),
          versionNonce: Math.floor(Math.random() * 1000000),
        };
        icons.push(iconElement);
        iconX += iconSpacing; // Próxima ícone
      }
    });
    
    return icons;
  };

  // 5. Inserir Carta como Pista no Quadro (✅ VERSÃO FINAL: Design Melhorado + Metadados)
  // 5. Inserir Carta como Pista no Quadro (VERSÃO DEFINITIVA E ESTÁVEL)
  const handleInsertCard = async (card: any) => {
    if (!excalidrawAPI || !excalidrawContainerRef.current) {
      console.warn('[ConspiracyBoard] Abortando: API ou container do Excalidraw não estão prontos.');
      return;
    }

    try {
      // PASSO 1: Cálculo e Validação Robusta de Coordenadas
      const rect = excalidrawContainerRef.current.getBoundingClientRect();
      let canvasWidth = rect.width;
      let canvasHeight = rect.height;
      if (!canvasWidth || canvasWidth <= 0 || !canvasHeight || canvasHeight <= 0) {
        const sidebarWidth = sidebarOpen ? 280 : 50; 
        canvasWidth = windowWidth - sidebarWidth;
        canvasHeight = windowHeight - 60;
      }

      const appState = excalidrawAPI.getAppState?.() || {};
      // ✅ Proteção crucial contra divisão por zero
      const zoomValue = appState.zoom?.value || 1; 
      if (zoomValue === 0) {
        console.error("[ConspiracyBoard] FATAL: Zoom é zero, abortando para prevenir NaN.");
        return;
      }

      const centerX = (canvasWidth / 2 - (appState.scrollX || 0)) / zoomValue;
      const centerY = (canvasHeight / 2 - (appState.scrollY || 0)) / zoomValue;

      // ✅ Validação final: se as coordenadas forem inválidas por qualquer motivo, não prosseguir.
      if (isNaN(centerX) || isNaN(centerY)) {
        console.error(`[ConspiracyBoard] FATAL: Coordenadas calculadas são NaN. centerX: ${centerX}, centerY: ${centerY}. Abortando.`);
        alert("Erro ao calcular a posição da pista. Tente mover o quadro e adicionar novamente.");
        return;
      }

      // PASSO 2: Geração de IDs Únicos
      const uniqueGroupId = `card-group-${card.id}-${Date.now()}`;
      let elementsToAdd: any[] = [];

      // --- LÓGICA PARA INSERÇÃO DE IMAGEM ---
      if (card.image_url) {
        const resp = await fetch(card.image_url);
        const blob = await resp.blob();
        const reader = new FileReader();
        
        reader.onloadend = () => {
          const base64data = reader.result as string;
          const fileId = `card-img-file-${uniqueGroupId}`;
          const fileData = { id: fileId, dataURL: base64data, mimeType: blob.type, created: Date.now() };
          
          const imageElement = { id: `img-${uniqueGroupId}`, type: "image", fileId, x: centerX - 125, y: centerY - 150, width: 250, height: 180, strokeColor: "#00f3ff", backgroundColor: "transparent", strokeWidth: 2, strokeStyle: "solid", groupIds: [uniqueGroupId] };
          const textElement = { id: `txt-${uniqueGroupId}`, type: "text", x: centerX - 125, y: centerY + 40, width: 250, text: (card.title || "PISTA VISUAL").toUpperCase(), fontSize: 20, fontFamily: 2, textAlign: "center", verticalAlign: "top", color: "#e0e0e0", groupIds: [uniqueGroupId] };

          // Adiciona os arquivos primeiro
          excalidrawAPI.addFiles([fileData]);
          // ✅ USA a API correta e segura para adicionar elementos
          excalidrawAPI.addElements([imageElement, textElement]);
        };
        reader.readAsDataURL(blob);
        
      // --- LÓGICA PARA PISTAS DE TEXTO ---
      } else {
        const cardWidth = 320, cardHeight = 220;
        const cardX = centerX - cardWidth / 2, cardY = centerY - cardHeight / 2;

        // Fundo e Header
        elementsToAdd.push({ id: `bg-${uniqueGroupId}`, type: "rectangle", x: cardX, y: cardY, width: cardWidth, height: cardHeight, strokeColor: "rgba(0, 243, 255, 0.5)", backgroundColor: "rgba(10, 15, 20, 0.95)", fillStyle: "solid", strokeWidth: 1, strokeStyle: "solid", roundness: { type: 1, value: 8 }, groupIds: [uniqueGroupId] });
        elementsToAdd.push({ id: `hdr-${uniqueGroupId}`, type: "rectangle", x: cardX, y: cardY, width: cardWidth, height: 40, strokeColor: "transparent", backgroundColor: "rgba(0, 243, 255, 0.1)", fillStyle: "solid", strokeWidth: 0, roundness: { type: 1, value: 8 }, groupIds: [uniqueGroupId] });
        
        // Título e Descrição com fallbacks
        elementsToAdd.push({ id: `title-${uniqueGroupId}`, type: "text", x: cardX + 15, y: cardY + 10, width: cardWidth - 30, text: (card.title || "RELATÓRIO DE PISTA").toUpperCase(), fontSize: 18, fontFamily: 2, textAlign: "center", verticalAlign: "middle", color: "#e0e0e0", groupIds: [uniqueGroupId] });
        elementsToAdd.push({ id: `desc-${uniqueGroupId}`, type: "text", x: cardX + 15, y: cardY + 55, width: cardWidth - 30, height: cardHeight - 100, text: card.description_public || "Nenhum detalhe adicional fornecido.", fontSize: 16, fontFamily: 1, textAlign: "left", verticalAlign: "top", color: "#cccccc", groupIds: [uniqueGroupId] });
        
        // Rodapé e Ícones
        elementsToAdd.push({ id: `line-${uniqueGroupId}`, type: "line", x: cardX, y: cardY + cardHeight - 40, width: cardWidth, height: 0, strokeColor: "rgba(0, 243, 255, 0.2)", strokeWidth: 1, strokeStyle: "solid", points: [[0, 0], [cardWidth, 0]], groupIds: [uniqueGroupId] });
        const metadataIcons = createMetadataIcons(card, cardX, cardY, cardHeight, uniqueGroupId);
        elementsToAdd.push(...metadataIcons);

        // ✅ USA a API correta e segura para adicionar elementos
        excalidrawAPI.addElements(elementsToAdd);
      }

      console.log(`[ConspiracyBoard] Inserção de '${card.title}' enviada para a API via addElements.`);

    } catch (e) {
      console.error('[ConspiracyBoard] Erro fatal ao inserir carta:', e);
      alert('Ocorreu um erro ao inserir a pista. Veja o console para detalhes.');
    }
  };

  return (
    <div className="conspiracy-layout">
      {/* Sidebar de Pistas */}
      <div className={`clue-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h3>ARQUIVO DO CASO</h3>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? '❮' : '❯'}
          </button>
        </div>
        {sidebarOpen && (
          <div className="clue-list-scroll">
            {cards.length === 0 ? (
              <p className="hint">Nenhuma pista disponível</p>
            ) : (
              <>
                <p className="hint">Clique para adicionar ao quadro</p>
                {cards.map(c => (
                  <div key={c.id} className="mini-card" onClick={() => handleInsertCard(c)} title={c.title}>
                    {c.image_url ? (
                      <div className="mini-thumb" style={{ backgroundImage: `url(${c.image_url})` }} />
                    ) : (
                      <div className="mini-thumb no-img">📄</div>
                    )}
                    <span>{c.title}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      <div className="board-wrapper">
        <div className="conspiracy-header">
          <h2>QUADRO DE INVESTIGAÇÃO COMPARTILHADO</h2>
          <div className="actions">
            {remoteUpdate && (
              <button className="btn-update-available" onClick={applyRemoteUpdate}>
                🔔 NOVA ATUALIZAÇÃO DISPONÍVEL
              </button>
            )}
            <button 
              className="btn-save-conspiracy" 
              onClick={handleSave}
              disabled={isSyncing}
              style={{ opacity: isSyncing ? 0.6 : 1 }}
            >
              {isSyncing ? '⏳ SINCRONIZANDO...' : '💾 SINCRONIZAR COM GRUPO'}
            </button>
            <button className="btn-close-conspiracy" onClick={onClose}>SAIR</button>
          </div>
        </div>

        <div className="excalidraw-container" ref={excalidrawContainerRef}>
          <Excalidraw 
            excalidrawAPI={(api) => setExcalidrawAPI(api)} 
            theme="dark"
          >
            <WelcomeScreen>
              <WelcomeScreen.Center>
                <WelcomeScreen.Center.Heading>
                  Arraste as pistas do arquivo para conectar os fatos.
                </WelcomeScreen.Center.Heading>
              </WelcomeScreen.Center>
            </WelcomeScreen>
            <MainMenu>
              <MainMenu.DefaultItems.ClearCanvas />
              <MainMenu.DefaultItems.ToggleTheme />
            </MainMenu>
          </Excalidraw>
        </div>
      </div>
    </div>
  );
}
