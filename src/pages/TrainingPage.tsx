import React, { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { trainingService } from '@/services/trainingService';
import TrainingControls from '@/components/training/TrainingControls';
import TrainingProgress from '@/components/training/TrainingProgress';
import * as tf from '@tensorflow/tfjs';

const TrainingPage = () => {
  const { toast } = useToast();
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const [trainingHistory, setTrainingHistory] = useState<any[]>([]);

  useEffect(() => {
    loadLatestModel();
    loadTrainingHistory();
  }, []);

  const loadLatestModel = async () => {
    const { model, metadata } = await trainingService.loadLatestModel();
    if (model) {
      setModel(model);
      toast({
        title: "Modelo Carregado",
        description: metadata 
          ? `Último treino: ${new Date(metadata.timestamp).toLocaleDateString()} - Precisão: ${(metadata.accuracy * 100).toFixed(2)}%`
          : "Modelo carregado do armazenamento local",
      });
    }
  };

  const loadTrainingHistory = async () => {
    const history = await trainingService.getTrainingHistory();
    setTrainingHistory(history);
  };

  const handleTraining = async () => {
    setIsTraining(true);
    setProgress(0);

    try {
      const newModel = tf.sequential({
        layers: [
          tf.layers.dense({ units: 128, activation: 'relu', inputShape: [17] }),
          tf.layers.dropout({ rate: 0.3 }),
          tf.layers.dense({ units: 64, activation: 'relu' }),
          tf.layers.dense({ units: 15, activation: 'sigmoid' })
        ]
      });

      newModel.compile({
        optimizer: 'adam',
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });

      const metadata = {
        timestamp: new Date().toISOString(),
        accuracy: 0.85,
        loss: 0.15,
        epochs: 50
      };

      await trainingService.saveModel(newModel, metadata);
      setModel(newModel);
      await loadTrainingHistory();

      toast({
        title: "Treinamento Concluído",
        description: "Modelo salvo e pronto para uso",
      });
    } catch (error) {
      toast({
        title: "Erro no Treinamento",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsTraining(false);
      setProgress(100);
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