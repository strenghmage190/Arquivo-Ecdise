// Regras e utilitários para o sistema de dados (dice)

export function rollDice(sides = 6, count = 1) {
  const results = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
  return results;
}

export default { rollDice };
