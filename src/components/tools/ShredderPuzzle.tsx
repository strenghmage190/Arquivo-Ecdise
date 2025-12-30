import React, { useState, useEffect } from 'react';

interface Props {
  imgSrc: string;
  rows?: number;
  cols?: number;
  onSolved: () => void;
  isGameMaster?: boolean;
}

export default function ShredderPuzzle({ imgSrc, rows = 1, cols = 8, onSolved, isGameMaster = false }: Props) {
  const [positions, setPositions] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);

  const initPositions = () => {
    const total = rows * cols;
    const arr = Array.from({ length: total }, (_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  useEffect(() => {
    setPositions(initPositions());
  }, [imgSrc, rows, cols]);

  useEffect(() => {
    const isSolved = positions.length > 0 && positions.every((val, idx) => val === idx);
    if (isSolved) {
      setTimeout(onSolved, 500);
    }
  }, [positions]);

  const handleTileClick = (index: number) => {
    if (selected === null) {
      setSelected(index);
    } else if (selected === index) {
      setSelected(null);
    } else {
      const newPos = [...positions];
      [newPos[selected], newPos[index]] = [newPos[index], newPos[selected]];
      setPositions(newPos);
      setSelected(null);
    }
  };

  const handleReset = () => setPositions(initPositions());
  const handleAutoSolve = () => {
    const ordered = Array.from({ length: rows * cols }, (_, i) => i);
    setPositions(ordered);
  };

  return (
    <div style={{ padding: 20, background: '#111', textAlign: 'center' }}>
      <h3 style={{ color: '#aaa', marginBottom: 10 }}>RECONSTRUIR DOCUMENTO</h3>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
        <button onClick={handleReset} style={{ padding: '6px 10px', cursor: 'pointer' }}>Embaralhar</button>
        {isGameMaster && <button onClick={handleAutoSolve} style={{ padding: '6px 10px', cursor: 'pointer' }}>Auto-resolver</button>}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 6,
        width: '100%',
        maxWidth: '720px',
        margin: '0 auto',
        background: '#000',
        padding: 10, border: '1px dashed #444'
      }}>
        {positions.map((tileId, index) => {
          const colIndex = tileId % cols;
          const rowIndex = Math.floor(tileId / cols);
          const xPercent = cols > 1 ? (colIndex * (100 / (cols - 1))) : 0;
          const yPercent = rows > 1 ? (rowIndex * (100 / (rows - 1))) : 0;
          return (
            <div
              key={index}
              onClick={() => handleTileClick(index)}
              title={`Parte ${index + 1}`}
              style={{
                aspectRatio: rows === 1 ? '4/1' : '1/1',
                backgroundImage: `url(${imgSrc})`,
                backgroundSize: `${cols * 100}% ${rows * 100}%`,
                backgroundPosition: `${xPercent}% ${yPercent}%`,
                cursor: 'pointer',
                border: selected === index ? '3px solid #b33' : '1px solid #333',
                boxShadow: selected === index ? '0 6px 18px rgba(179,51,51,0.2)' : 'inset 0 0 8px rgba(0,0,0,0.4)',
                filter: selected === index ? 'brightness(1.05)' : 'none',
                transform: selected === index ? 'scale(0.98)' : 'none',
                transition: 'all 0.12s ease',
                backgroundRepeat: 'no-repeat',
                backgroundOrigin: 'border-box',
                minHeight: 40
              }}
            />
          );
        })}
      </div>
      <p style={{ fontSize: 12, color: '#bbb', marginTop: 10 }}>
        {rows === 1 ? 'Este documento passou por uma trituradora.' : 'A foto foi rasgada em pedaços.'}<br />
        Clique em duas partes para trocar de posição.
      </p>
    </div>
  );
}
