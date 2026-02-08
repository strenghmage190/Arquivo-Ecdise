import React, { useState, useEffect, useMemo } from 'react';
import './ShredderPuzzle.css';

interface Props {
  imgSrc: string;
  rows?: number;
  cols?: number;
  onSolved: () => void;
  isGameMaster?: boolean;
  investigationId?: string;
  cardId?: string;
}

export default function ShredderPuzzle({ 
  imgSrc, 
  rows = 1, 
  cols = 8, 
  onSolved, 
  isGameMaster = false,
  investigationId = 'default',
  cardId = 'default'
}: Props) {
  const storageKey = `shredder_${investigationId}_${cardId}`;
  const revealedKey = `shredder_revealed_${investigationId}_${cardId}`;
  
  const [positions, setPositions] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealedPieces, setRevealedPieces] = useState<Set<number>>(new Set());
  const [showRevealControl, setShowRevealControl] = useState(false);
  const [gmViewMode, setGmViewMode] = useState<'all' | 'player'>('all'); // GM can toggle view
  const [showPreview, setShowPreview] = useState(false); // Preview da imagem completa
  const [imageAspectRatio, setImageAspectRatio] = useState<number>(1);

  const total = rows * cols;

  // Carregar imagem para pegar aspect ratio real
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight;
      setImageAspectRatio(ratio);
    };
    img.src = imgSrc;
  }, [imgSrc]);

  const initPositions = () => {
    const arr = Array.from({ length: total }, (_, i) => i);
    // Fisher-Yates Shuffle - garantir embaralhamento total
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    // Shuffle adicional para garantir máximo embaralhamento
    for (let i = 0; i < arr.length; i++) {
      const j = Math.floor(Math.random() * arr.length);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Load saved state
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      const savedRevealed = localStorage.getItem(revealedKey);
      
      // SEMPRE embaralhar ao carregar, ignorar estado salvo
      setPositions(initPositions());
      
      if (savedRevealed) {
        setRevealedPieces(new Set(JSON.parse(savedRevealed)));
      }
    } catch {
      setPositions(initPositions());
    }
  }, [imgSrc, rows, cols]);

  // Save revealed pieces state (não salvar positions para forçar embaralhamento sempre)
  useEffect(() => {
    if (revealedPieces.size > 0) {
      localStorage.setItem(revealedKey, JSON.stringify(Array.from(revealedPieces)));
    }
  }, [revealedPieces, revealedKey]);

  // Check if solved
  useEffect(() => {
    const isSolved = positions.length > 0 && positions.every((val, idx) => val === idx);
    if (isSolved) {
      setTimeout(onSolved, 500);
    }
  }, [positions, onSolved]);

  const handleTileClick = (index: number, ctrlKey: boolean = false) => {
    // GM pode usar Ctrl+Click para revelar/ocultar peças individualmente
    if (isGameMaster && ctrlKey) {
      if (revealedPieces.has(index)) {
        // Ocultar peça
        const newRevealed = new Set(revealedPieces);
        newRevealed.delete(index);
        setRevealedPieces(newRevealed);
      } else {
        // Revelar peça
        setRevealedPieces(prev => new Set([...prev, index]));
      }
      return;
    }
    
    // GM no modo 'player' se comporta como jogador comum
    const canInteract = isGameMaster && gmViewMode === 'all' 
      ? true  // GM pode interagir com qualquer peça no modo 'all'
      : revealedPieces.has(index); // Senão, só peças reveladas
    
    if (!canInteract) {
      return;
    }

    if (selected === null) {
      setSelected(index);
    } else if (selected === index) {
      setSelected(null);
    } else {
      // Verificar se ambas as peças podem ser trocadas
      const selectedCanInteract = isGameMaster && gmViewMode === 'all' 
        ? true 
        : revealedPieces.has(selected);
      
      if (canInteract && selectedCanInteract) {
        const newPos = [...positions];
        [newPos[selected], newPos[index]] = [newPos[index], newPos[selected]];
        setPositions(newPos);
        setSelected(null);
      }
    }
  };

  const handleReset = () => {
    const newPos = initPositions();
    setPositions(newPos);
    setSelected(null);
  };

  const handleAutoSolve = () => {
    const ordered = Array.from({ length: total }, (_, i) => i);
    setPositions(ordered);
    setSelected(null);
  };

  const handleRevealPiece = (index: number) => {
    setRevealedPieces(prev => new Set([...prev, index]));
  };

  const handleRevealAll = () => {
    const allIndices = Array.from({ length: total }, (_, i) => i);
    setRevealedPieces(new Set(allIndices));
  };

  const handleRevealRandom = (count: number = 1) => {
    const unrevealed = Array.from({ length: total }, (_, i) => i)
      .filter(i => !revealedPieces.has(i));
    
    if (unrevealed.length === 0) return;
    
    const toReveal = Math.min(count, unrevealed.length);
    const newRevealed = new Set(revealedPieces);
    
    for (let i = 0; i < toReveal; i++) {
      const randomIndex = Math.floor(Math.random() * unrevealed.length);
      newRevealed.add(unrevealed[randomIndex]);
      unrevealed.splice(randomIndex, 1);
    }
    
    setRevealedPieces(newRevealed);
  };

  const handleClearRevealed = () => {
    setRevealedPieces(new Set());
    localStorage.removeItem(revealedKey);
  };

  const progress = positions.length > 0 
    ? positions.filter((val, idx) => val === idx).length / total * 100 
    : 0;

  // Determinar layout baseado em rows/cols
  const layoutClass = rows === 1 
    ? 'layout-horizontal' 
    : cols === 1 
      ? 'layout-vertical' 
      : 'layout-grid';

  return (
    <div className="shredder-puzzle-wrapper">
      {/* Progress bar */}
      <div className="shredder-progress">
        <div className="shredder-progress-bar">
          <div 
            className={`shredder-progress-fill ${progress === 100 ? 'complete' : ''}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="shredder-progress-text">
          Progresso: {Math.round(progress)}% | Reveladas: {revealedPieces.size}/{total}
        </p>
      </div>

      {/* Controls */}
      <div className="shredder-controls">
        <button className="shredder-btn" onClick={handleReset}>
          🔄 Embaralhar
        </button>
        
        {isGameMaster && (
          <>
            <button 
              className={`shredder-btn btn-toggle ${showRevealControl ? 'active' : ''}`}
              onClick={() => setShowRevealControl(!showRevealControl)}
            >
              {showRevealControl ? '✕ Fechar' : '🔓 Controles GM'}
            </button>
            <button 
              className="shredder-btn btn-view-mode"
              onClick={() => setGmViewMode(prev => prev === 'all' ? 'player' : 'all')}
            >
              {gmViewMode === 'all' ? '👁️ Ver Tudo' : '👥 Ver Jogador'}
            </button>
            <button 
              className="shredder-btn"
              onMouseDown={() => setShowPreview(true)}
              onMouseUp={() => setShowPreview(false)}
              onMouseLeave={() => setShowPreview(false)}
            >
              🖼️ Preview
            </button>
          </>
        )}
      </div>

      {/* GM Reveal Controls */}
      {isGameMaster && showRevealControl && (
        <div className="shredder-gm-controls">
          <p className="shredder-gm-title">🎮 Controle de Revelação</p>
          <p className="shredder-gm-hint">💡 Ctrl+Click em peças para revelar/ocultar individualmente</p>
          <div className="shredder-gm-buttons">
            <button onClick={() => handleRevealRandom(1)}>Revelar 1</button>
            <button onClick={() => handleRevealRandom(3)}>Revelar 3</button>
            <button onClick={() => handleRevealRandom(5)}>Revelar 5</button>
            <button onClick={handleRevealAll}>Revelar TODAS</button>
            <button onClick={handleClearRevealed}>Ocultar TODAS</button>
          </div>
        </div>
      )}

      {/* Preview Overlay (GM) */}
      {isGameMaster && showPreview && (
        <div className="shredder-preview-overlay">
          <div className="shredder-preview-title">🖼️ Preview - Imagem Completa</div>
          <img src={imgSrc} alt="Preview completo" className="shredder-preview-img" />
          <div className="shredder-preview-hint">Solte o botão para fechar</div>
        </div>
      )}

      {/* Puzzle Grid */}
      <div 
        className={`shredder-grid ${layoutClass}`}
        style={
          rows > 1 && cols > 1 
            ? { gridTemplateColumns: `repeat(${cols}, 1fr)` } 
            : undefined
        }
      >
        {positions.map((tileId, index) => {
          const colIndex = tileId % cols;
          const rowIndex = Math.floor(tileId / cols);
          const xPercent = cols > 1 ? (colIndex * (100 / (cols - 1))) : 0;
          const yPercent = rows > 1 ? (rowIndex * (100 / (rows - 1))) : 0;
          
          const gmCanSee = isGameMaster && gmViewMode === 'all';
          const isRevealed = gmCanSee || revealedPieces.has(index);
          const isCorrect = positions[index] === index;
          
          // Calcular aspect ratio da peça baseado na imagem real
          let pieceAspect: string | number = 1;
          if (rows === 1) {
            // Tiras horizontais: cada peça é 1/cols da largura, altura total
            pieceAspect = imageAspectRatio / cols;
          } else if (cols === 1) {
            // Tiras verticais: largura total, cada peça é 1/rows da altura
            pieceAspect = imageAspectRatio * rows;
          } else {
            // Grade: divide em ambas direções
            pieceAspect = imageAspectRatio / cols * rows;
          }
          
          const pieceClasses = [
            'shredder-piece',
            selected === index && 'selected',
            isCorrect && 'correct',
            !isRevealed && 'locked'
          ].filter(Boolean).join(' ');
          
          return (
            <div
              key={index}
              className={pieceClasses}
              onClick={(e) => handleTileClick(index, e.ctrlKey)}
              style={{
                backgroundImage: isRevealed ? `url(${imgSrc})` : 'none',
                backgroundSize: `${cols * 100}% ${rows * 100}%`,
                backgroundPosition: `${xPercent}% ${yPercent}%`,
                aspectRatio: `${pieceAspect}`
              }}
              title={
                isGameMaster && !isRevealed 
                  ? `Peça ${index + 1} - OCULTA (Ctrl+Click p/ revelar)`
                  : isGameMaster && isRevealed
                    ? `Peça ${index + 1}${isCorrect ? ' ✓' : ''} (Ctrl+Click p/ ocultar)`
                    : isRevealed 
                      ? `Parte ${index + 1}${isCorrect ? ' ✓' : ''}` 
                      : 'Peça bloqueada'
              }
            >
              {/* Locked Overlay */}
              {!isRevealed && (
                <div className="shredder-piece-locked-overlay">
                  <div className="shredder-piece-lock-icon">🔒</div>
                  <div className="shredder-piece-lock-text">BLOQUEADA</div>
                </div>
              )}
              
              {/* GM Badge */}
              {isGameMaster && (
                <div className={`shredder-piece-gm-badge ${revealedPieces.has(index) ? 'revealed' : 'hidden'}`}>
                  <span>{revealedPieces.has(index) ? '👁️' : '🔒'}</span>
                  <span>#{index + 1}</span>
                </div>
              )}
              
              {/* Correct Mark */}
              {isCorrect && isRevealed && (
                <div className="shredder-piece-correct-mark">✓</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Instructions */}
      <div className="shredder-instructions">
        {rows === 1 ? 'Documento triturado em tiras horizontais.' : cols === 1 ? 'Documento triturado em tiras verticais.' : 'Foto rasgada em pedaços.'}
        <br />
        <span dangerouslySetInnerHTML={{ __html: 
          isGameMaster 
            ? gmViewMode === 'all'
              ? '🎮 <strong>GM:</strong> Vendo TODAS as peças. Use "Ver Jogador" para testar a visão dos players.'
              : '👥 <strong>GM:</strong> Visualizando como JOGADOR. Use os Controles GM para revelar peças.'
            : revealedPieces.size === 0
              ? '🔒 Aguarde o GM revelar peças para começar a reconstruir.'
              : `<strong>Clique em duas peças</strong> para trocar de posição. ${revealedPieces.size}/${total} peças disponíveis.`
        }} />
      </div>
    </div>
  );
}
