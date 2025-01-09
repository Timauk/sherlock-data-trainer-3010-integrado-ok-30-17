import { useState, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { WorkerPool } from '@/utils/performance/workerPool';
import { summarizeHistoricalData } from '@/utils/dataManagement/dataSummarization';
import { createEnsembleModels, trainEnsemble } from '@/utils/aiModel/ensembleLearning';
import * as tf from '@tensorflow/tfjs';

export const useModelTraining = () => {
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const { toast } = useToast();
  const workerPool = new WorkerPool();

  const initializeModel = useCallback(async () => {
    try {
      console.log('Tentando carregar modelo existente...');
      const initialModel = await tf.loadLayersModel('indexeddb://initial-model');
      console.log('Modelo carregado com sucesso:', initialModel);
      setModel(initialModel);
      return initialModel;
    } catch (error) {
      console.log('Modelo inicial não encontrado, criando novo modelo...');
      const newModel = tf.sequential();
      
      // Configuração atualizada do modelo
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
      
      console.log('Novo modelo criado:', newModel);
      setModel(newModel);
      
      // Salva o modelo inicial
      await newModel.save('indexeddb://initial-model');
      console.log('Novo modelo salvo no IndexedDB');
      
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
      console.log('Iniciando treinamento com dados:', {
        historicalDataLength: historicalData.length,
        datesLength: dates.length,
        lunarDataLength: lunarData.length
      });

      const summaries = summarizeHistoricalData(historicalData, dates);
      setProgress(20);

      const models = await createEnsembleModels();
      setProgress(40);

      await trainEnsemble(models, historicalData, summaries, lunarData);
      setProgress(90);

      await Promise.all([
        models.seasonal.save('indexeddb://seasonal-model'),
        models.frequency.save('indexeddb://frequency-model'),
        models.lunar.save('indexeddb://lunar-model'),
        models.sequential.save('indexeddb://sequential-model')
      ]);

      setProgress(100);
      toast({
        title: "Treinamento Concluído",
        description: "Os modelos foram treinados e salvos com sucesso!"
      });
    } catch (error) {
      console.error('Erro durante o treinamento:', error);
      toast({
        title: "Erro no Treinamento",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsTraining(false);
      workerPool.terminate();
    }
  }, [toast]);

  return {
    isTraining,
    progress,
    startTraining,
    model,
    initializeModel
  };
};