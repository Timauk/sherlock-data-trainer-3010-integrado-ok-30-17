import React from 'react';
import * as tf from '@tensorflow/tfjs';
import { useToast } from "@/hooks/use-toast";
import { saveModel } from '@/utils/continuousLearning';
import { Button } from "@/components/ui/button";
import { Upload, Save } from 'lucide-react';

interface DataLoaderProps {
  onCsvUpload: (data: number[][]) => void;
  addLog: (message: string) => void;
  setTrainedModel: (model: any) => void;
  trainedModel: any;
}

const DataLoader: React.FC<DataLoaderProps> = ({
  onCsvUpload,
  addLog,
  setTrainedModel,
  trainedModel
}) => {
  const { toast } = useToast();

  const loadCSV = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.trim().split('\n').slice(1);
      const data = lines.map(line => 
        line.split(',').map(Number).filter((_, index) => index > 1 && index <= 16)
      );
      onCsvUpload(data);
      addLog("CSV carregado e processado com sucesso!");
      addLog(`Número de registros carregados: ${data.length}`);
    } catch (error) {
      addLog(`Erro ao carregar CSV: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const loadModelFromFile = async (jsonFile: File, weightsFile: File) => {
    try {
      const model = await tf.loadLayersModel(tf.io.browserFiles([jsonFile, weightsFile]));
      await saveModel(model);
      setTrainedModel(model);
      toast({
        title: "Modelo Carregado",
        description: "O modelo foi carregado e salvo com sucesso.",
      });
      addLog("Modelo carregado com sucesso!");
    } catch (error) {
      addLog(`Erro ao carregar o modelo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      console.error("Detalhes do erro:", error);
      toast({
        title: "Erro ao Carregar Modelo",
        description: "Ocorreu um erro ao carregar o modelo. Verifique o console para mais detalhes.",
        variant: "destructive",
      });
    }
  };

  const saveModelToFile = async () => {
    if (trainedModel) {
      try {
        await trainedModel.save('downloads://modelo-sherlok');
        addLog("Modelo salvo com sucesso!");
        toast({
          title: "Modelo Salvo",
          description: "O modelo atual foi salvo com sucesso.",
        });
      } catch (error) {
        addLog(`Erro ao salvar o modelo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        console.error("Detalhes do erro:", error);
        toast({
          title: "Erro ao Salvar Modelo",
          description: "Ocorreu um erro ao salvar o modelo. Verifique o console para mais detalhes.",
          variant: "destructive",
        });
      }
    } else {
      addLog("Nenhum modelo para salvar.");
      toast({
        title: "Nenhum Modelo",
        description: "Não há nenhum modelo carregado para salvar.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="csvInput" className="block mb-2">Carregar CSV de Jogos:</label>
        <input
          type="file"
          id="csvInput"
          accept=".csv"
          onChange={(e) => e.target.files && loadCSV(e.target.files[0])}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
      <div>
        <label htmlFor="modelJsonInput" className="block mb-2">Carregar Modelo Treinado (JSON):</label>
        <input
          type="file"
          id="modelJsonInput"
          accept=".json"
          onChange={(e) => e.target.files && loadModelFromFile(e.target.files[0], new File([], 'dummy'))}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
      <div>
        <label htmlFor="modelWeightsInput" className="block mb-2">Carregar Pesos do Modelo (bin):</label>
        <input
          type="file"
          id="modelWeightsInput"
          accept=".bin"
          onChange={(e) => e.target.files && loadModelFromFile(new File([], 'dummy'), e.target.files[0])}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
      <Button onClick={() => saveModelToFile()}>
        <Save className="mr-2 h-4 w-4" /> Salvar Modelo Atual
      </Button>
    </div>
  );
};

export default DataLoader;