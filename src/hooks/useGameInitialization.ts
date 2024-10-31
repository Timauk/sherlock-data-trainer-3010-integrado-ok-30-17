import { useState, useCallback } from 'react';
import { Player } from '@/types/gameTypes';
import { TOTAL_PLAYERS, INITIAL_WEIGHTS_LENGTH } from '@/constants/gameConstants';

export const useGameInitialization = () => {
  const [players, setPlayers] = useState<Player[]>([]);

  const initializePlayers = useCallback(() => {
    const newPlayers = Array.from({ length: TOTAL_PLAYERS }, (_, i) => ({
      id: i + 1,
      score: 0,
      predictions: [],
      weights: Array.from({ length: INITIAL_WEIGHTS_LENGTH }, () => Math.floor(Math.random() * 1001)),
      fitness: 0,
      generation: 1
    }));
    setPlayers(newPlayers);
  }, []);

  return {
    players,
    setPlayers,
    initializePlayers
  };
};