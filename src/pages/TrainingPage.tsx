import React, { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import DataUploader from '../components/DataUploader';
import DataUpdateButton from '../components/DataUpdateButton';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { trainingService } from '@/services/trainingService';
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

  const handleCsvUpload = async (file: File) => {
    // Implementar lógica CSV
    console.log("CSV uploaded:", file);
  };

  const handleModelUpload = async (jsonFile: File, weightsFile: File) => {
    try {
      const model = await tf.loadLayersModel(tf.io.browserFiles([jsonFile, weightsFile]));
      setModel(model);
      toast({
        title: "Modelo Carregado",
        description: "Modelo carregado com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  const handleSaveModel = async () => {
    if (!model) {
      toast({
        title: "Erro",
        description: "Nenhum modelo para salvar",
        variant: "destructive"
      });
      return;
    }

    try {
      await model.save('downloads://lotofacil-model');
      toast({
        title: "Sucesso",
        description: "Modelo salvo com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  const handleTraining = async (data: number[][]) => {
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

      const xs = tf.tensor2d(data.map(row => row.slice(0, -15)));
      const ys = tf.tensor2d(data.map(row => row.slice(-15)));

      await newModel.fit(xs, ys, {
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            setProgress((epoch + 1) * 2);
          }
        }
      });

      const metadata = {
        timestamp: new Date().toISOString(),
        accuracy: 0.85, // Exemplo - usar valor real do treinamento
        loss: 0.15,    // Exemplo - usar valor real do treinamento
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
        variant: "destructive"
      });
    } finally {
      setIsTraining(false);
      setProgress(100);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Treinamento do Modelo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <DataUploader 
              onCsvUpload={handleCsvUpload}
              onModelUpload={handleModelUpload}
              onSaveModel={handleSaveModel}
            />
            <DataUpdateButton />
            
            {isTraining && (
              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground">
                  Progresso: {progress}%
                </p>
              </div>
            )}

            {model && (
              <div className="bg-secondary p-4 rounded-lg">
                <p className="font-medium">Modelo Atual Carregado</p>
                <p className="text-sm text-muted-foreground">
                  Pronto para fazer previsões
                </p>
              </div>
            )}

            {trainingHistory.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium">Histórico de Treinamentos</h3>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {trainingHistory.map((entry, index) => (
                    <div key={index} className="bg-secondary/50 p-2 rounded">
                      <p className="text-sm">
                        Data: {new Date(entry.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm">
                        Precisão: {(entry.metadata.accuracy * 100).toFixed(2)}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainingPage;
