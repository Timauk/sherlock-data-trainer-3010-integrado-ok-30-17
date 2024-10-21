import { useState, useCallback } from 'react';

interface Player {
  id: number;
  score: number;
  predictions: number[];
  weights: number[];
}

export const usePlayerLogic = () => {
  const [players, setPlayers] = useState<Player[]>([]);

  const initializePlayers = useCallback(() => {
    const newPlayers = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      score: 0,
      predictions: [],
      weights: Array.from({ length: 17 }, () => Math.floor(Math.random() * 1001))
    }));
    setPlayers(newPlayers);
  }, []);

  const updatePlayerScores = useCallback((matches: number[]) => {
    setPlayers(prevPlayers =>
      prevPlayers.map((player, index) => ({
        ...player,
        score: player.score + calculateDynamicReward(matches[index]),
      }))
    );
  }, []);

  const calculateDynamicReward = (matches: number): number => {
    return matches > 12 ? Math.pow(2, matches - 12) : -Math.pow(2, 12 - matches);
  };

  return { players, initializePlayers, updatePlayerScores };
};