import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import TrainingControls from '@/components/training/TrainingControls';
import TrainingProgress from '@/components/training/TrainingProgress';
import { supabase } from '@/integrations/supabase/client';
import * as tf from '@tensorflow/tfjs';
import { trainModelWithGames } from '@/services/training/modelTraining';

const TrainingPage = () => {
  const { toast } = useToast();
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const [trainingHistory, setTrainingHistory] = useState<any[]>([]);

  useEffect(() => {
    loadTrainingHistory();
  }, []);

  const loadTrainingHistory = async () => {
    const { data } = await supabase
      .from('trained_models')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      setTrainingHistory(data);
    }
  };

  const handleTraining = async () => {
    setIsTraining(true);
    setProgress(0);

    try {
      const { data: games } = await supabase
        .from('historical_games')
        .select('*')
        .order('concurso', { ascending: true });

      if (!games || games.length === 0) {
        throw new Error('Nenhum jogo encontrado para treinamento');
      }

      const { model: trainedModel, history } = await trainModelWithGames(games);
      setModel(trainedModel);
      setProgress(100);
      
      await loadTrainingHistory();

      const finalAccuracy = history.history.acc?.[history.history.acc.length - 1];
      const accuracyDisplay = finalAccuracy !== undefined ? (Number(finalAccuracy) * 100).toFixed(2) : '0.00';

      toast({
        title: "Treinamento Concluído",
        description: `Modelo treinado com ${games.length} jogos. Precisão final: ${accuracyDisplay}%`,
      });
    } catch (error) {
      toast({
        title: "Erro no Treinamento",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <TrainingControls 
        isTraining={isTraining}
        onStartTraining={handleTraining}
      />
      <TrainingProgress 
        progress={progress}
        model={model}
        trainingHistory={trainingHistory}
      />
    </div>
  );
};

export default TrainingPage;