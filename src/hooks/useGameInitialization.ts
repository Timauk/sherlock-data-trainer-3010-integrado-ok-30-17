import { useState, useCallback } from 'react';
import { Player } from '@/types/playerTypes';

export const useGameInitialization = () => {
  const [players, setPlayers] = useState<Player[]>([]);

  const initializePlayers = useCallback(() => {
    const newPlayers = Array.from({ length: 10 }, (_, index) => ({
      id: index + 1, // Using sequential numbers for IDs
      score: 0,
      predictions: [],
      weights: Array.from({ length: 17 }, () => Math.floor(Math.random() * 1001)),
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