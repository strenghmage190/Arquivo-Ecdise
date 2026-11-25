import React, { useState, useRef, useMemo } from 'react';
import {
  Flashlight,
  Flame,
  Eye,
  FlipHorizontal,
  RotateCw,
  BookOpen,
  CheckCircle2,
  MousePointer,
} from 'lucide-react';
import {
  DocumentLayer,
  PhysicalDocumentMetadata,
} from '../../types/forensicPillars';
import { useForensicDispatch } from '../../contexts/ForensicDispatchContext';
import './PhysicalDocumentTable.css';

type LightTool = 'inspect' | 'uv' | 'heater' | 'lens_r' | 'lens_g' | 'lens_b';

interface FragmentPiece {
  id: number;
  correctIndex: number;
  rotation: number;
  flipped: boolean;
}

interface Props {
  documentData: PhysicalDocumentMetadata;
  title?: string;
}

export default function PhysicalDocumentTable({ documentData, title = 'Documento Físico' }: Props) {
  const { openFieldManual } = useForensicDispatch();
  const paperRef = useRef<HTMLDivElement | null>(null);

  const [tool, setTool] = useState<LightTool>('inspect');
  const [globalSide, setGlobalSide] = useState<'front' | 'back'>('front');
  const [pointer, setPointer] = useState<{ x: number; y: number; active: boolean }>({
    x: -200,
    y: -200,
    active: false,
  });

  const [heatCells, setHeatCells] = useState<Record<string, number>>({});
  const [isHeating, setIsHeating] = useState(false);

  const isFragmented = documentData.fragmentation.mode !== 'intact';
  const totalCols = Math.max(1, documentData.fragmentation.cols || 6);

  const [pieces, setPieces] = useState<FragmentPiece[]>(() => {
    const arr: FragmentPiece[] = Array.from({ length: totalCols }, (_, i) => ({
      id: i,
      correctIndex: i,
      rotation: documentData.fragmentation.allowRotation ? (i % 2 === 0 ? 180 : 0) : 0,
      flipped: false,
    }));
    for (let i = arr.length - 1; i > 0; i--) {
      const j = (i * 7 + 3) % (i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });
  const [selectedPieceIdx, setSelectedPieceIdx] = useState<number | null>(null);

  const isAssembled = useMemo(() => {
    if (!isFragmented) return true;
    return pieces.every((p, idx) => p.correctIndex === idx && p.rotation % 360 === 0);
  }, [pieces, isFragmented]);

  const applyHeatAt = (clientX: number, clientY: number) => {
    const rect = paperRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pctX = Math.floor(((clientX - rect.left) / rect.width) * 10);
    const pctY = Math.floor(((clientY - rect.top) / rect.height) * 10);
    setHeatCells((prev) => {
      const next = { ...prev };
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const k = `${pctX + dx}:${pctY + dy}`;
          next[k] = Math.min(1, (next[k] || 0) + (dx === 0 && dy === 0 ? 0.35 : 0.18));
        }
      }
      return next;
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const rect = paperRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPointer({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    });
    if (tool === 'heater' && isHeating) {
      applyHeatAt(e.clientX, e.clientY);
    }
  };

  const getLayerHeat = (layer: DocumentLayer): number => {
    const bx = Math.floor(layer.x / 10);
    const by = Math.floor(layer.y / 10);
    return heatCells[`${bx}:${by}`] || 0;
  };

  const renderLayer = (l: DocumentLayer) => {
    if (tool === 'lens_r' && l.inkType === 'chromatic_r') return null;
    if (tool === 'lens_g' && l.inkType === 'chromatic_g') return null;
    if (tool === 'lens_b' && l.inkType === 'chromatic_b') return null;

    let opacity = l.opacity;
    if (l.inkType === 'uv') {
      if (tool !== 'uv') return null;
    } else if (l.inkType === 'thermal') {
      const heat = getLayerHeat(l);
      if (heat <= 0.05) return null;
      opacity = Math.min(1, heat);
    }

    if (l.kind === 'freehand' && l.points && l.points.length > 1) {
      const d = l.points
        .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`)
        .join(' ');
      return (
        <svg
          key={l.id}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className={`pdt-layer ink-${l.inkType}`}
          style={{ inset: 0, width: '100%', height: '100%', opacity }}
        >
          <path
            d={d}
            fill="none"
            stroke={l.inkType === 'uv' ? '#d8b4fe' : l.color || '#1e293b'}
            strokeWidth={l.strokeWidth || 1.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    }

    return (
      <div
        key={l.id}
        className={`pdt-layer ink-${l.inkType}`}
        style={{
          left: `${l.x}%`,
          top: `${l.y}%`,
          transform: `translate(-50%, -50%) rotate(${l.rotation}deg)`,
          color: l.inkType === 'uv' ? '#d8b4fe' : l.color,
          fontSize: `${l.fontSize || 18}px`,
          opacity,
        }}
      >
        {l.content}
      </div>
    );
  };

  const handlePieceClick = (idx: number) => {
    if (selectedPieceIdx === null) {
      setSelectedPieceIdx(idx);
    } else if (selectedPieceIdx === idx) {
      setSelectedPieceIdx(null);
    } else {
      setPieces((prev) => {
        const next = [...prev];
        [next[selectedPieceIdx], next[idx]] = [next[idx], next[selectedPieceIdx]];
        return next;
      });
      setSelectedPieceIdx(null);
    }
  };

  const rotateSelected = () => {
    if (selectedPieceIdx === null) return;
    setPieces((prev) =>
      prev.map((p, i) => (i === selectedPieceIdx ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
    );
  };

  const flipAllSides = () => {
    setGlobalSide((s) => (s === 'front' ? 'back' : 'front'));
    if (isFragmented) {
      setPieces((prev) => prev.map((p) => ({ ...p, flipped: !p.flipped })));
    }
  };

  const visibleSideLayers = documentData.layers.filter((l) => l.side === globalSide);

  return (
    <div className="pdt-table">
      <div className="pdt-topbar">
        <div>
          <h3>MESA DE LUZ — PERÍCIA DOCUMENTAL</h3>
          <span>{title} • Lado: {globalSide === 'front' ? 'FRENTE' : 'VERSO'}</span>
        </div>
        <div className="pdt-top-actions">
          {isFragmented && isAssembled && (
            <span className="pdt-assembled-badge">
              <CheckCircle2 size={14} /> Documento Reconstruído
            </span>
          )}
          <button type="button" onClick={flipAllSides}>
            <FlipHorizontal size={14} /> Virar Folha
          </button>
          <button type="button" onClick={() => openFieldManual('document')}>
            <BookOpen size={14} /> Manual
          </button>
        </div>
      </div>

      <div className="pdt-main">
        <aside className="pdt-tools">
          <button
            type="button"
            className={tool === 'inspect' ? 'active' : ''}
            onClick={() => setTool('inspect')}
          >
            <MousePointer size={15} />
            <span>Inspeção Livre</span>
          </button>
          <button
            type="button"
            className={tool === 'uv' ? 'active uv' : ''}
            onClick={() => setTool('uv')}
          >
            <Flashlight size={15} />
            <span>Lanterna UV</span>
          </button>
          <button
            type="button"
            className={tool === 'heater' ? 'active heat' : ''}
            onClick={() => setTool('heater')}
          >
            <Flame size={15} />
            <span>Aquecedor de Campo</span>
          </button>
          <div className="pdt-lens-group">
            <span>Lentes de Filtro:</span>
            <button
              type="button"
              className={tool === 'lens_r' ? 'active r' : ''}
              onClick={() => setTool(tool === 'lens_r' ? 'inspect' : 'lens_r')}
            >
              <Eye size={13} /> Vermelha
            </button>
            <button
              type="button"
              className={tool === 'lens_g' ? 'active g' : ''}
              onClick={() => setTool(tool === 'lens_g' ? 'inspect' : 'lens_g')}
            >
              <Eye size={13} /> Verde
            </button>
            <button
              type="button"
              className={tool === 'lens_b' ? 'active b' : ''}
              onClick={() => setTool(tool === 'lens_b' ? 'inspect' : 'lens_b')}
            >
              <Eye size={13} /> Azul
            </button>
          </div>

          {isFragmented && documentData.fragmentation.allowRotation && (
            <button
              type="button"
              onClick={rotateSelected}
              disabled={selectedPieceIdx === null}
              title="Selecione uma tira e clique para girar 90°"
            >
              <RotateCw size={15} />
              <span>Girar Pedaço 90°</span>
            </button>
          )}
        </aside>

        <div className="pdt-surface">
          <div
            ref={paperRef}
            className={`pdt-paper side-${globalSide} tool-${tool}`}
            onPointerDown={(e) => {
              if (tool === 'heater') {
                setIsHeating(true);
                applyHeatAt(e.clientX, e.clientY);
              }
            }}
            onPointerMove={handlePointerMove}
            onPointerUp={() => setIsHeating(false)}
            onPointerLeave={() => {
              setIsHeating(false);
              setPointer((p) => ({ ...p, active: false }));
            }}
          >
            {!isFragmented ? (
              <>
                {globalSide === 'front' && documentData.frontBaseUrl && (
                  <img src={documentData.frontBaseUrl} alt="Frente" className="pdt-bg" />
                )}
                {visibleSideLayers.map(renderLayer)}
              </>
            ) : (
              <div
                className="pdt-frag-grid"
                style={{ gridTemplateColumns: `repeat(${totalCols}, 1fr)` }}
              >
                {pieces.map((p, idx) => (
                  <div
                    key={p.id}
                    className={`pdt-frag-strip ${selectedPieceIdx === idx ? 'selected' : ''}`}
                    onClick={() => handlePieceClick(idx)}
                    style={{
                      transform: `rotate(${p.rotation}deg)`,
                    }}
                  >
                    <div
                      className="pdt-frag-inner"
                      style={{
                        width: `${totalCols * 100}%`,
                        transform: `translateX(-${(p.correctIndex / totalCols) * 100}%)`,
                      }}
                    >
                      {globalSide === 'front' && documentData.frontBaseUrl && (
                        <img src={documentData.frontBaseUrl} alt="" className="pdt-bg" />
                      )}
                      {visibleSideLayers.map(renderLayer)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tool === 'uv' && pointer.active && (
              <div
                className="pdt-uv-beam"
                style={{
                  background: `radial-gradient(circle 95px at ${pointer.x}px ${pointer.y}px, rgba(168, 85, 247, 0.25), rgba(10, 6, 22, 0.92) 70%)`,
                }}
              />
            )}
            {tool === 'heater' && pointer.active && (
              <div
                className="pdt-heat-cursor"
                style={{ left: pointer.x, top: pointer.y }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
