import { useState, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '@/utils/logging/systemLogger';

export const useModelTraining = () => {
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const { toast } = useToast();

  const initializeModel = useCallback(async () => {
    try {
      systemLogger.log('system', 'Tentando carregar modelo existente...');
      const initialModel = await tf.loadLayersModel('indexeddb://initial-model');
      systemLogger.log('system', 'Modelo carregado com sucesso');
      setModel(initialModel);
      return initialModel;
    } catch (error) {
      systemLogger.log('system', 'Criando novo modelo...');
      const newModel = tf.sequential();
      
      newModel.add(tf.layers.dense({ 
        units: 128, 
        activation: 'relu', 
        inputShape: [15],
        name: 'input_layer'
      }));
      
      newModel.add(tf.layers.dense({ 
        units: 64, 
        activation: 'relu',
        name: 'hidden_layer'
      }));
      
      newModel.add(tf.layers.dense({ 
        units: 15, 
        activation: 'sigmoid',
        name: 'output_layer'
      }));
      
      newModel.compile({
        optimizer: 'adam',
        loss: 'meanSquaredError',
        metrics: ['accuracy']
      });
      
      systemLogger.log('system', 'Novo modelo criado');
      setModel(newModel);
      
      await newModel.save('indexeddb://initial-model');
      systemLogger.log('system', 'Novo modelo salvo no IndexedDB');
      
      return newModel;
    }
  }, []);

  const startTraining = useCallback(async (
    historicalData: number[][],
    dates: Date[],
    lunarData: any[]
  ) => {
    try {
      setIsTraining(true);
      setProgress(0);
      
      const currentModel = await initializeModel();
      
      // Preparar dados de treinamento
      const xs = tf.tensor2d(historicalData.map(row => row.map(n => n / 25)));
      const ys = tf.tensor2d(historicalData.map(row => row.map(n => n / 25)));
      
      // Treinar modelo
      await currentModel.fit(xs, ys, {
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            const progress = ((epoch + 1) / 50) * 100;
            setProgress(progress);
            systemLogger.log('system', `Época ${epoch + 1}/50`, logs);
          }
        }
      });
      
      // Limpar tensores
      xs.dispose();
      ys.dispose();
      
      // Salvar modelo treinado
      await currentModel.save('indexeddb://trained-model');
      
      toast({
        title: "Treinamento Concluído",
        description: "O modelo foi treinado e salvo com sucesso!"
      });
      
    } catch (error) {
      systemLogger.log('system', 'Erro durante o treinamento', { error });
      toast({
        title: "Erro no Treinamento",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsTraining(false);
    }
  }, [toast, initializeModel]);

  return {
    isTraining,
    progress,
    startTraining,
    model,
    initializeModel
  };
};