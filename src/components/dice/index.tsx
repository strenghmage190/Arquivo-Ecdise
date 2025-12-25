import React from 'react';
import { rollDice } from '../../rules/diceRules';

export function DiceUI() {
  const handleRoll = () => {
    const res = rollDice(6, 1);
    alert('Rolled: ' + res.join(','));
  };
  return <button onClick={handleRoll}>Roll Dice</button>;
}
