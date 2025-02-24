import { useState, useCallback } from 'react';
import { Player } from '@/types/gameTypes';

export const useGameInitialization = () => {
  const [players, setPlayers] = useState<Player[]>([]);

  const initializePlayers = useCallback((): void => {
    const newPlayers: Player[] = Array.from({ length: 1000 }, (_, i) => ({
      id: i + 1,
      name: `Player ${i + 1}`,
      score: 0,
      predictions: [],
      weights: Array.from({ length: 17 }, () => Math.floor(Math.random() * 1001)),
      fitness: 0,
      generation: 1,
      matches: 0
    }));
    setPlayers(newPlayers);
  }, []);

  return {
    players,
    setPlayers,
    initializePlayers
  };
};