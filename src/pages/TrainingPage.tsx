import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as tf from '@tensorflow/tfjs';
import { Upload, BarChart2, Save, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import TrainingChart from '@/components/TrainingChart';
import { processarCSV } from '@/utils/dataProcessing';
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TrainingPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const [logs, setLogs] = useState<{ epoch: number; loss: number; val_loss: number }[]>([]);
  const [batchSize, setBatchSize] = useState(32);
  const [epochs, setEpochs] = useState(100);
  const [learningRate, setLearningRate] = useState(0.001);
  const [validationSplit, setValidationSplit] = useState(0.2); // 20% para validação
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const { data: trainingData, isLoading, isError } = useQuery({
    queryKey: ['trainingData', file],
    queryFn: async () => {
      if (!file) return null;
      const text = await file.text();
      return processarCSV(text);
    },
    enabled: !!file,
  });

  const startTraining = async () => {
    if (!trainingData) return;

    const numeroDeBolas = trainingData[0].bolas.length;

    // Modelo mais robusto com regularização para evitar overfitting
    const newModel = tf.sequential();
    
    // Camada de entrada com regularização L1 e L2
    newModel.add(tf.layers.dense({
      units: 256,
      activation: 'relu',
      inputShape: [numeroDeBolas + 2],
      kernelRegularizer: tf.regularizers.l1l2({ l1: 0.01, l2: 0.01 })
    }));
    
    // Batch Normalization para melhor estabilidade
    newModel.add(tf.layers.batchNormalization());
    
    // Dropout para reduzir overfitting
    newModel.add(tf.layers.dropout({ rate: 0.3 }));
    
    // Camada intermediária
    newModel.add(tf.layers.dense({
      units: 128,
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l1l2({ l1: 0.01, l2: 0.01 })
    }));
    
    newModel.add(tf.layers.batchNormalization());
    newModel.add(tf.layers.dropout({ rate: 0.2 }));
    
    // Camada de saída
    newModel.add(tf.layers.dense({
      units: numeroDeBolas,
      activation: 'sigmoid'
    }));

    // Otimizador com learning rate adaptativo
    const optimizer = tf.train.adamax(learningRate);

    newModel.compile({
      optimizer,
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    const xs = tf.tensor2d(trainingData.map(d => [...d.bolas, d.numeroConcurso, d.dataSorteio]));
    const ys = tf.tensor2d(trainingData.map(d => d.bolas));

    try {
      await newModel.fit(xs, ys, {
        epochs,
        batchSize,
        validationSplit,
        callbacks: {
          onEpochEnd: (epoch, log) => {
            if (log) {
              setTrainingProgress(Math.floor(((epoch + 1) / epochs) * 100));
              setLogs(prevLogs => [...prevLogs, {
                epoch: epoch + 1,
                loss: log.loss,
                val_loss: log.val_loss || 0
              }]);

              // Alerta de overfitting
              if (log.val_loss && log.loss && log.val_loss > log.loss * 1.2) {
                toast({
                  title: "Alerta de Overfitting",
                  description: "O modelo pode estar sofrendo overfitting. Considere ajustar os parâmetros.",
                  variant: "destructive"
                });
              }
            }
          }
        }
      });

      setModel(newModel);
      toast({
        title: "Treinamento Concluído",
        description: "O modelo foi treinado com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro no Treinamento",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }

    xs.dispose();
    ys.dispose();
  };

  const saveModel = async () => {
    if (model) {
      await model.save('downloads://modelo-lotofacil');
      toast({
        title: "Modelo Salvo",
        description: "O modelo foi salvo com sucesso!"
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Treinamento</CardTitle>
          <CardDescription>
            Ajuste os parâmetros para otimizar o treinamento do modelo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Batch Size</label>
              <Select onValueChange={(value) => setBatchSize(Number(value))} defaultValue={batchSize.toString()}>
                <SelectTrigger>
                  <SelectValue placeholder="Batch Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16">16</SelectItem>
                  <SelectItem value="32">32</SelectItem>
                  <SelectItem value="64">64</SelectItem>
                  <SelectItem value="128">128</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Épocas</label>
              <Select onValueChange={(value) => setEpochs(Number(value))} defaultValue={epochs.toString()}>
                <SelectTrigger>
                  <SelectValue placeholder="Épocas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Taxa de Aprendizado</label>
              <Select onValueChange={(value) => setLearningRate(Number(value))} defaultValue={learningRate.toString()}>
                <SelectTrigger>
                  <SelectValue placeholder="Learning Rate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.0001">0.0001</SelectItem>
                  <SelectItem value="0.001">0.001</SelectItem>
                  <SelectItem value="0.01">0.01</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Validação Split</label>
              <Select onValueChange={(value) => setValidationSplit(Number(value))} defaultValue={validationSplit.toString()}>
                <SelectTrigger>
                  <SelectValue placeholder="Validation Split" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.1">10%</SelectItem>
                  <SelectItem value="0.2">20%</SelectItem>
                  <SelectItem value="0.3">30%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="fileInput" className="block text-sm font-medium mb-2">Carregar dados (CSV):</label>
            <input
              type="file"
              id="fileInput"
              accept=".csv"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>

          {isError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>
                Ocorreu um erro ao processar o arquivo CSV.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4">
            <Button
              onClick={startTraining}
              disabled={!trainingData || isLoading}
              className="bg-green-500 hover:bg-green-700"
            >
              <BarChart2 className="mr-2 h-4 w-4" />
              Iniciar Treinamento
            </Button>

            <Button
              onClick={saveModel}
              disabled={!model}
              className="bg-blue-500 hover:bg-blue-700"
            >
              <Save className="mr-2 h-4 w-4" />
              Salvar Modelo
            </Button>
          </div>
        </CardContent>
      </Card>

      {trainingProgress > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Progresso do Treinamento</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={trainingProgress} className="w-full" />
            <p className="text-center mt-2">{trainingProgress}% Concluído</p>
          </CardContent>
        </Card>
      )}

      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Métricas de Treinamento</CardTitle>
            <CardDescription>
              Acompanhe a evolução do loss e validation loss durante o treinamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TrainingChart logs={logs} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TrainingPage;