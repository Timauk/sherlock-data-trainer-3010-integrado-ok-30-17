import { useState, useCallback } from 'react';
import { Player } from '@/types/gameTypes';
import { useToast } from "@/hooks/use-toast";

export const useGameState = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [generation, setGeneration] = useState(1);
  const [gameCount, setGameCount] = useState(0);
  const [boardNumbers, setBoardNumbers] = useState<number[]>([]);
  const [concursoNumber, setConcursoNumber] = useState(0);
  const [isInfiniteMode, setIsInfiniteMode] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const { toast } = useToast();

  const toggleManualMode = useCallback(() => {
    setIsManualMode(prev => {
      const newMode = !prev;
      toast({
        title: newMode ? "Modo Manual Ativado" : "Modo Manual Desativado",
        description: newMode ? 
          "A clonagem automática está desativada." : 
          "A clonagem automática está ativada novamente.",
      });
      return newMode;
    });
  }, [toast]);

  return {
    players,
    setPlayers,
    generation,
    setGeneration,
    gameCount,
    setGameCount,
    boardNumbers,
    setBoardNumbers,
    concursoNumber,
    setConcursoNumber,
    isInfiniteMode,
    setIsInfiniteMode,
    isManualMode,
    toggleManualMode
  };
};