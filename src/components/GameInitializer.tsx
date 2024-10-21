import React, { useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { loadModel } from '@/utils/continuousLearning';
import * as tf from '@tensorflow/tfjs';

interface GameInitializerProps {
  csvData: number[][];
  trainedModel: tf.LayersModel | null;
  initializePlayers: () => void;
  addLog: (message: string) => void;
  setTrainedModel: (model: tf.LayersModel | null) => void;
}

const GameInitializer: React.FC<GameInitializerProps> = ({
  csvData,
  trainedModel,
  initializePlayers,
  addLog,
  setTrainedModel
}) => {
  const { toast } = useToast();

  useEffect(() => {
    const loadSavedModel = async () => {
      const savedModel = await loadModel();
      if (savedModel) {
        setTrainedModel(savedModel);
        toast({
          title: "Modelo Carregado",
          description: "Um modelo salvo anteriormente foi carregado com sucesso.",
        });
      } else {
        addLog("Nenhum modelo salvo encontrado. Utilize a opção de carregar modelo.");
      }
    };
    loadSavedModel();
  }, [toast, addLog, setTrainedModel]);

  useEffect(() => {
    if (csvData.length > 0 && trainedModel) {
      initializePlayers();
      addLog("Jogo pronto para iniciar. Clique em 'Iniciar' para começar.");
    }
  }, [csvData, trainedModel, initializePlayers, addLog]);

  return null;
};

export default GameInitializer;