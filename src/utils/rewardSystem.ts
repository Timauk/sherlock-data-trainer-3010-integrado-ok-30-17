export const calculateReward = (matches: number): number => {
  // Sistema de pontuação positiva (11-15 acertos)
  if (matches >= 11) {
    return matches - 10; // 11=+1, 12=+2, 13=+3, 14=+4, 15=+5
  }
  // Sistema de punição (6-10 acertos)
  else if (matches >= 6) {
    return -(11 - matches); // 10=-1, 9=-2, 8=-3, 7=-4, 6=-5
  }
  // Punição máxima para menos de 6 acertos
  return -5;
};

export const logReward = (matches: number, playerId: number): string => {
  const reward = calculateReward(matches);
  if (reward > 0) {
    return `[Jogador #${playerId}] Premiação: +${reward} pontos por acertar ${matches} números!`;
  } else {
    return `[Jogador #${playerId}] Penalidade: ${reward} pontos por acertar apenas ${matches} números.`;
  }
};