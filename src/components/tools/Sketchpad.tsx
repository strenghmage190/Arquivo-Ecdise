import React, { useState, useEffect } from 'react';
import { Excalidraw, exportToBlob, MainMenu, WelcomeScreen } from "@excalidraw/excalidraw";
const ExcalidrawAny: any = Excalidraw;
import './Sketchpad.css';

interface SketchpadProps {
  initialData?: any;
  onSaveImage: (imageFile: File, jsonContent: string) => void;
  onClose: () => void;
  backgroundImageUrl?: string;
}

export default function Sketchpad({ initialData, onSaveImage, onClose, backgroundImageUrl }: SketchpadProps) {
  const parsed = typeof initialData === 'string' ? JSON.parse(initialData) : (initialData || null);
  const [elements, setElements] = useState<any[]>(parsed?.elements || []);
  const [appState, setAppState] = useState<any>(parsed?.appState || {});
  const [files, setFiles] = useState<any>({});

  useEffect(() => {
    if (parsed) {
      setElements(parsed.elements || []);
      setAppState(parsed.appState || {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  const handleSave = async () => {
    if (!elements || elements.length === 0) {
      alert("Desenhe algo antes de salvar!");
      return;
    }

    try {
      const blob = await exportToBlob({
        elements,
        mimeType: "image/png",
        appState: {
          ...appState,
          exportWithDarkMode: true,
          exportBackground: false,
        },
        files,
      });

      if (blob) {
        const file = new File([blob], `sketch_${Date.now()}.png`, { type: 'image/png' });
        const jsonContent = JSON.stringify({ elements, appState });
        onSaveImage(file, jsonContent);
      }
    } catch (e) {
      console.error('Sketchpad save failed', e);
      alert('Falha ao exportar desenho. Veja console.');
    }
  };

  return (
    <div className="sketchpad-overlay">
      <div className="sketchpad-container">
        <div className="sketch-header">
           <h3 style={{color: '#daceaa'}}>RASCUNHO PARANORMAL</h3>
           <div style={{display:'flex', gap: 10}}>
             <button className="btn-save-sketch" onClick={handleSave}>SALVAR NO ARQUIVO</button>
             <button className="btn-close-sketch" onClick={onClose}>FECHAR</button>
           </div>
        </div>

        <div className="excalidraw-wrapper">
          <ExcalidrawAny
            className="excalidraw"
            theme="dark"
            initialData={parsed || undefined}
            
            onChange={(elements_, state) => { setElements(elements_ as any as any[]); setAppState(state); }}
            onPointerUpdate={() => { /* noop for now */ }}
            onPaste={(data, event) => { return false; }}
          >
            <WelcomeScreen>
              <WelcomeScreen.Center>
                <WelcomeScreen.Center.Heading>
                  Criar Ritual ou Mapa
                </WelcomeScreen.Center.Heading>
              </WelcomeScreen.Center>
            </WelcomeScreen>
            <MainMenu>
               <MainMenu.DefaultItems.ClearCanvas />
               <MainMenu.DefaultItems.ToggleTheme />
               <MainMenu.DefaultItems.ChangeCanvasBackground />
            </MainMenu>
          </ExcalidrawAny>
        </div>
      </div>
    </div>
  );
}
