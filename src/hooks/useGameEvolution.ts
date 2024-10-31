import { useCallback } from 'react';
import { Player } from '@/types/gameTypes';
import { learningQualityMonitor } from '@/utils/monitoring/learningQualityMonitor';
import { cloneChampion, updateModelWithChampionKnowledge } from '@/utils/playerEvolution';
import { selectBestPlayers } from '@/utils/evolutionSystem';

export const useGameEvolution = (
  gameState: any,
  trainedModel: any,
  numbers: number[][],
  showToast: (title: string, description: string) => void,
  addLog: (message: string) => void
) => {
  return useCallback(async () => {
    const bestPlayers = selectBestPlayers(gameState.players);
    gameState.setGameCount(prev => prev + 1);

    const formatPredictions = (player: Player): number[][] => {
      if (!player.predictions.length) return [];
      return player.predictions.map(pred => 
        Array.isArray(pred) ? pred : [pred]
      );
    };

    const learningAnalysis = bestPlayers.map(player => 
      learningQualityMonitor.analyzePlayerLearning(
        player,
        numbers,
        formatPredictions(player)
      )
    );

    const compromisedLearning = learningAnalysis.filter(a => !a.isLearningEffective).length;
    if (compromisedLearning > bestPlayers.length * 0.5) {
      showToast({
        title: "Alerta de Aprendizado",
        description: `${compromisedLearning} jogadores podem estar com aprendizado comprometido.`,
        variant: "destructive"
      });
    }

    if (gameState.gameCount % 1000 === 0 && bestPlayers.length > 0) {
      const champion = bestPlayers[0];
      
      const championAnalysis = learningQualityMonitor.analyzePlayerLearning(
        champion,
        numbers,
        formatPredictions(champion)
      );

      if (championAnalysis.isLearningEffective) {
        const clones = cloneChampion(champion, gameState.players.length);
        gameState.setPlayers(clones);
        
        if (trainedModel) {
          try {
            const updatedModel = await updateModelWithChampionKnowledge(
              trainedModel,
              champion,
              gameState.trainingData
            );
            
            showToast({
              title: "Modelo Atualizado",
              description: `Conhecimento do Campeão (Score: ${champion.score}) incorporado ao modelo`,
            });

          } catch (error) {
            console.error("Erro ao atualizar modelo com conhecimento do campeão:", error);
          }
        }
      } else {
        showToast({
          title: "Alerta de Qualidade",
          description: "Campeão atual pode não estar aprendendo efetivamente. Mantendo geração anterior.",
          variant: "destructive"
        });
      }
    } else {
      const newGeneration = bestPlayers.map(player => ({
        ...player,
        generation: gameState.generation + 1
      }));
      
      gameState.setPlayers(newGeneration);
    }

    gameState.setGeneration(prev => prev + 1);
    
    gameState.setEvolutionData(prev => [
      ...prev,
      ...gameState.players.map(player => ({
        generation: gameState.generation,
        playerId: player.id,
        score: player.score,
        fitness: player.fitness
      }))
    ]);

    if (bestPlayers.length > 0) {
      addLog(`Melhor jogador da geração ${gameState.generation}: Score ${bestPlayers[0].score}`);
      showToast({
        title: "Nova Geração",
        description: `Melhor fitness: ${bestPlayers[0].fitness.toFixed(2)}`,
      });
    }
  }, [gameState, trainedModel, numbers, showToast, addLog]);
};
