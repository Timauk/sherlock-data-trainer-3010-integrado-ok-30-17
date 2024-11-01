import React, { useState, useEffect } from 'react';
import DataUploader from '../components/DataUploader';
import DataUpdateButton from '../components/DataUpdateButton';
import { useToast } from "@/components/ui/use-toast";
import { useGameState } from '@/hooks/useGameState';
import { useGameLogic } from '@/hooks/useGameLogic';
import { processCSV, extractDateFromCSV } from '@/utils/csvUtils';
import { createModel, trainModel, TrainingConfig } from '@/utils/aiModel';
import { validateData } from '@/utils/validation/dataValidation';
import { useServerStatus } from '@/hooks/useServerStatus';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';
import { useCheckpointLoader } from '@/hooks/useCheckpointLoader';
import * as tf from '@tensorflow/tfjs';

const TrainingPage = () => {
  const { toast } = useToast();
  const { status } = useServerStatus();
  const { loadCheckpoint } = useCheckpointLoader();
  const [trainedModel, setTrainedModel] = useState<tf.LayersModel | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const {
    players,
    setPlayers,
    generation,
    setGeneration,
    gameCount,
    setGameCount,
    evolutionData,
    setEvolutionData,
    boardNumbers,
    setBoardNumbers,
    concursoNumber,
    setConcursoNumber,
    isInfiniteMode,
    setIsInfiniteMode,
    trainingData,
    setTrainingData,
  } = useGameState();

  const gameLogic = useGameLogic(trainingData, trainedModel);
  useSupabaseSync();

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleCsvUpload = async (file: File) => {
    try {
      const text = await file.text();
      const data = processCSV(text);
      const dates = extractDateFromCSV(text);
      const validationResult = validateData(data);

      if (!validationResult.isValid) {
        toast({
          title: "Erro nos dados",
          description: validationResult.errors.join(', '),
          variant: "destructive"
        });
        return;
      }

      setTrainingData(data);
      addLog(`CSV carregado com ${data.length} registros`);
    } catch (error) {
      toast({
        title: "Erro ao processar CSV",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  const handleModelUpload = async (jsonFile: File, weightsFile: File) => {
    try {
      const model = await tf.loadLayersModel(tf.io.browserFiles(
        [jsonFile, weightsFile]
      ));
      setTrainedModel(model);
      addLog("Modelo carregado com sucesso");
    } catch (error) {
      toast({
        title: "Erro ao carregar modelo",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  const handleSaveModel = async () => {
    if (!trainedModel) {
      toast({
        title: "Erro",
        description: "Nenhum modelo treinado para salvar",
        variant: "destructive"
      });
      return;
    }

    try {
      await trainedModel.save('downloads://lotofacil-model');
      addLog("Modelo salvo com sucesso");
    } catch (error) {
      toast({
        title: "Erro ao salvar modelo",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  const startTraining = async () => {
    if (!trainingData.length) {
      toast({
        title: "Erro",
        description: "Carregue os dados de treinamento primeiro",
        variant: "destructive"
      });
      return;
    }

    setIsTraining(true);
    try {
      const model = createModel();
      const config: TrainingConfig = {
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.2,
        earlyStoppingPatience: 5
      };

      const history = await trainModel(model, trainingData, config);
      setTrainedModel(model);
      addLog(`Treinamento concluído. Loss final: ${history.history.loss.slice(-1)[0]}`);
    } catch (error) {
      toast({
        title: "Erro no treinamento",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsTraining(false);
    }
  };

  useEffect(() => {
    const loadLastCheckpoint = async () => {
      const checkpoint = await loadCheckpoint();
      if (checkpoint) {
        setTrainedModel(checkpoint.model);
        setTrainingData(checkpoint.trainingData);
        addLog("Checkpoint carregado com sucesso");
      }
    };

    loadLastCheckpoint();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Treinamento</h1>
        <DataUpdateButton />
      </div>
      <DataUploader 
        onCsvUpload={handleCsvUpload}
        onModelUpload={handleModelUpload}
        onSaveModel={handleSaveModel}
      />
      <div className="mt-4 space-y-4">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
          onClick={startTraining}
          disabled={isTraining || !trainingData.length}
        >
          {isTraining ? 'Treinando...' : 'Iniciar Treinamento'}
        </button>
        <div className="h-64 overflow-y-auto bg-gray-100 p-4 rounded">
          {logs.map((log, index) => (
            <div key={index} className="text-sm">{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrainingPage;
