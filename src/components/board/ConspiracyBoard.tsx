import React, { useEffect, useState } from 'react';
import { Excalidraw, MainMenu, WelcomeScreen } from '@excalidraw/excalidraw';
import { fetchCards } from '../../api/investigations';
import { fetchConspiracyBoard, saveConspiracyBoard } from '../../api/whiteboard';
import { supabase } from '../../supabaseClient';
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

  // load initial board and cards
  useEffect(() => {
    let mounted = true;
    async function load() {
      const [boardData, cardsData] = await Promise.all([fetchConspiracyBoard(investigationId), fetchCards(investigationId)]);
      if (!mounted) return;
      setCards(cardsData || []);
      // If excalidraw API is already available, hydrate immediately.
      if (boardData && excalidrawAPI && excalidrawAPI.updateScene) {
        try {
          excalidrawAPI.updateScene({ elements: boardData.elements || [], appState: boardData.appState || {} });
          if (boardData.files && excalidrawAPI.addFiles) {
            const files: any[] = Object.values(boardData.files || {});
            if (files.length) excalidrawAPI.addFiles(files);
          }
        } catch (e) {
          console.warn('failed to hydrate excalidraw scene', e);
        }
      }
      setLoading(false);
    }
    load();
    return () => { mounted = false; };
  }, [investigationId]);

  // If excalidraw API becomes available after initial load, ensure we hydrate the scene
  useEffect(() => {
    if (!excalidrawAPI) return;
    let mounted = true;
    async function hydrate() {
      try {
        const boardData = await fetchConspiracyBoard(investigationId);
        if (!mounted || !boardData) return;
        try {
          excalidrawAPI.updateScene({ elements: boardData.elements || [], appState: boardData.appState || {} });
          if (boardData.files && excalidrawAPI.addFiles) {
            const files: any[] = Object.values(boardData.files || {});
            if (files.length) excalidrawAPI.addFiles(files);
          }
        } catch (e) {
          console.warn('failed to hydrate excalidraw scene on api ready', e);
        }
      } catch (e) {
        console.error('hydrate conspiracy board failed', e);
      }
    }
    hydrate();
    return () => { mounted = false; };
  }, [excalidrawAPI, investigationId]);

  // realtime subscription for remote updates
  useEffect(() => {
    const channel = supabase
      .channel(`conspiracy-updates-${investigationId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'investigations', filter: `id=eq.${investigationId}` }, (payload: any) => {
        const newData = payload.new?.conspiracy_board_data;
        if (!newData) return;
        // don't auto-apply: notify user there's a remote update available
        console.log('ConspiracyBoard: remote update received (pending)');
        setRemoteUpdate(newData);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [investigationId]);

  const handleSave = async () => {
    if (!excalidrawAPI) return;
    try {
      const elements = excalidrawAPI.getSceneElements ? excalidrawAPI.getSceneElements() : [];
      const appState = excalidrawAPI.getAppState ? excalidrawAPI.getAppState() : {};
      const files = excalidrawAPI.getFiles ? excalidrawAPI.getFiles() : {};
      await saveConspiracyBoard(investigationId, elements, appState, files);
      alert('Quadro Sincronizado com o Grupo!');
    } catch (e) {
      console.error('handleSave failed', e);
      alert('Falha ao sincronizar quadro. Veja console.');
    }
  };

  // Apply a pending remote update that was received via realtime
  const applyRemoteUpdate = () => {
    if (!remoteUpdate || !excalidrawAPI || !excalidrawAPI.updateScene) return;
    try {
      excalidrawAPI.updateScene({ elements: remoteUpdate.elements || [], appState: remoteUpdate.appState || {} });
      setRemoteUpdate(null);
      alert('Atualização remota aplicada.');
    } catch (e) { console.error('applyRemoteUpdate failed', e); alert('Falha ao aplicar atualização remota. Veja console.'); }
  };

  const dismissRemoteUpdate = () => { setRemoteUpdate(null); };

  const handleInsertCard = async (card: any) => {
    if (!excalidrawAPI) return;
    try {
      if (card.image_url) {
        const resp = await fetch(card.image_url);
        const blob = await resp.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          const fileId = `card-${card.id}`;
          const filesMap: Record<string, any> = {
            [fileId]: { id: fileId, dataURL: base64data, mimeType: blob.type, created: Date.now() },
          };
          const currElements = excalidrawAPI.getSceneElements?.() || [];
          const appState = excalidrawAPI.getAppState?.() || {};
          const sx = appState.scrollX || 0;
          const sy = appState.scrollY || 0;
          const imageElement = {
            type: 'image', fileId, status: 'saved', x: sx + 100, y: sy + 100, width: 240, height: 160,
          };
          const textElement = { type: 'text', x: imageElement.x, y: imageElement.y + imageElement.height + 8, text: card.title || '', fontSize: 18 };

            try {
              // merge with existing files and update scene atomically
              const existingFiles = excalidrawAPI.getFiles?.() || {};
              excalidrawAPI.updateScene({ elements: [...currElements, imageElement, textElement], files: { ...existingFiles, ...filesMap } });
            } catch (e) { console.warn('updateScene failed', e); }
        };
        reader.readAsDataURL(blob);
      } else {
        const textElement = { type: 'text', x: (excalidrawAPI.getAppState?.().scrollX || 0) + 200, y: (excalidrawAPI.getAppState?.().scrollY || 0) + 200, text: `PISTA: ${card.title}\n\n${card.description_public || ''}`, fontSize: 18 };
        try { excalidrawAPI.updateScene({ elements: [...(excalidrawAPI.getSceneElements?.() || []), textElement] }); } catch (e) { console.warn('updateScene failed', e); }
      }
    } catch (e) {
      console.error('Erro ao inserir imagem', e);
    }
  };

  return (
    <div className="conspiracy-layout">
      <div className={`clue-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header"><h3>ARQUIVO DO CASO</h3><button onClick={() => setSidebarOpen(!sidebarOpen)}>{sidebarOpen ? '<<' : '>>'}</button></div>
        {sidebarOpen && (
          <div className="clue-list-scroll">
            <p className="hint">Clique para adicionar ao quadro</p>
            {cards.map(c => (
              <div key={c.id} className="mini-card" onClick={() => handleInsertCard(c)}>
                {c.image_url ? <div className="mini-thumb" style={{ backgroundImage: `url(${c.image_url})` }} /> : <div className="mini-thumb no-img">📝</div>}
                <span>{c.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="board-wrapper">
        <div className="conspiracy-header">
          <h2>QUADRO DE CONSPIRAÇÃO COMPARTILHADO</h2>
          <div className="actions">
               <button className="btn-save-conspiracy" onClick={handleSave}>💾 SINCRONIZAR COM GRUPO</button>
               <button className="btn-save-conspiracy" onClick={() => {
                 // export current scene as JSON
                 const elements = excalidrawAPI?.getSceneElements?.() || [];
                 const appState = excalidrawAPI?.getAppState?.() || {};
                 const files = excalidrawAPI?.getFiles?.() || {};
                 const bundle = { elements, appState, files };
                 const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
                 const url = URL.createObjectURL(blob);
                 const a = document.createElement('a');
                 a.href = url; a.download = `conspiracy_${investigationId}_${Date.now()}.json`;
                 document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
               }}>⬇️ EXPORTAR JSON</button>
               <button className="btn-close-conspiracy" onClick={onClose}>SAIR</button>
          </div>
        </div>
        {remoteUpdate && (
          <div style={{ padding: 8, background: '#2a2a2a', color: '#ffd', display: 'flex', gap: 8, alignItems: 'center' }}>
            <div>Há uma atualização remota disponível.</div>
            <button onClick={applyRemoteUpdate} style={{ marginLeft: 8 }}>Aplicar</button>
            <button onClick={dismissRemoteUpdate} style={{ marginLeft: 8 }}>Ignorar</button>
          </div>
        )}
        <div className="excalidraw-container">
          <Excalidraw excalidrawAPI={(api) => setExcalidrawAPI(api)} theme="dark">
            <WelcomeScreen>
              <WelcomeScreen.Center>
                <WelcomeScreen.Center.Heading>Arraste pistas do arquivo para conectar os pontos.</WelcomeScreen.Center.Heading>
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
