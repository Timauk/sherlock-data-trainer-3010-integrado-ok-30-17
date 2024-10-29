import { useState, useCallback } from 'react';
import { Player } from '@/types/gameTypes';
import { selectBestPlayers } from '@/utils/evolutionSystem';
import { cloneChampion } from '@/utils/playerEvolution';
import { useToast } from "@/hooks/use-toast";

export const useGameEvolution = (
  players: Player[],
  setPlayers: (players: Player[]) => void,
  generation: number,
  setGeneration: (gen: number) => void,
  gameCount: number,
  addLog: (message: string) => void
) => {
  const { toast } = useToast();
  const [evolutionData, setEvolutionData] = useState<Array<{
    generation: number;
    playerId: number;
    score: number;
    fitness: number;
  }>>([]);

  const evolveGeneration = useCallback(async () => {
    const bestPlayers = selectBestPlayers(players);
    
    if (gameCount % 1000 === 0 && bestPlayers.length > 0) {
      const champion = bestPlayers[0];
      const clones = cloneChampion(champion, players.length);
      setPlayers(clones);
      
      toast({
        title: "Nova Geração de Clones",
        description: `Campeão (Score: ${champion.score}) gerou nova população`,
      });
    } else {
      const newGeneration = bestPlayers.map(player => ({
        ...player,
        generation: generation + 1
      }));
      
      setPlayers(newGeneration);
    }

    setGeneration(generation + 1);
    
    setEvolutionData(prev => [
      ...prev,
      ...players.map(player => ({
        generation,
        playerId: player.id,
        score: player.score,
        fitness: player.fitness
      }))
    ]);

    if (bestPlayers.length > 0) {
      addLog(`Melhor jogador da geração ${generation}: Score ${bestPlayers[0].score}`);
    }
  }, [players, generation, gameCount, setPlayers, setGeneration, addLog, toast]);

  return {
    evolutionData,
    setEvolutionData,
    evolveGeneration
  };
};