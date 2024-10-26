import * as tf from '@tensorflow/tfjs';
import { useToast } from "@/components/ui/use-toast";

export const updateModelWithNewData = async (
  trainedModel: tf.LayersModel,
  trainingData: number[][],
  addLog: (message: string) => void
) => {
  if (!trainedModel || trainingData.length === 0) return trainedModel;

  try {
    const xs = tf.tensor2d(trainingData.map(row => row.slice(0, -15)));
    const ys = tf.tensor2d(trainingData.map(row => row.slice(-15)));

    await trainedModel.fit(xs, ys, {
      epochs: 1,
      batchSize: 32,
    });

    xs.dispose();
    ys.dispose();

    addLog(`Modelo atualizado com ${trainingData.length} novos registros.`);
    const { toast } = useToast();
    toast({
      title: "Modelo Atualizado",
      description: "O modelo foi atualizado com sucesso com os novos dados.",
    });

    return trainedModel;
  } catch (error) {
    addLog(`Erro ao atualizar o modelo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    console.error("Detalhes do erro:", error);
    return trainedModel;
  }
};