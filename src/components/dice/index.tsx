import React from 'react';
import { rollDice } from '../../rules/diceRules';

export function DiceUI() {
  const [result, setResult] = React.useState<number[] | null>(null);

  const handleRoll = () => {
    const res = rollDice(6, 1);
    setResult(res);
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
        padding: 'var(--space-2)',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <button
        type="button"
        className="btn-ordo btn-ordo-primary control-md"
        onClick={handleRoll}
        aria-label="Rolar dado de 6 lados"
      >
        Rolar D6
      </button>
      {result && (
        <div
          role="status"
          aria-live="polite"
          className="tabular-nums"
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--text-primary)',
            textAlign: 'center',
          }}
        >
          Resultado: {result.join(', ')}
        </div>
      )}
    </div>
  );
}

export default DiceUI;
