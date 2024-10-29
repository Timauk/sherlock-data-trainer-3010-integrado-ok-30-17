import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Player } from '@/types/gameTypes';
import * as tf from '@tensorflow/tfjs';

interface ChampionPredictionsProps {
  champion: Player | undefined;
  trainedModel: tf.LayersModel | null;
  lastConcursoNumbers: number[];
}

const ChampionPredictions: React.FC<ChampionPredictionsProps> = ({
  champion,
  trainedModel,
  lastConcursoNumbers
}) => {
  const [predictions, setPredictions] = useState<Array<{ numbers: number[], estimatedAccuracy: number }>>([]);
  const { toast } = useToast();

  const generatePredictions = async () => {
    if (!champion || !trainedModel || !lastConcursoNumbers.length) {
      toast({
        title: "Erro",
        description: "Não há campeão ou modelo treinado disponível.",
        variant: "destructive"
      });
      return;
    }

    try {
      const newPredictions = [];
      
      // Prepara os dados de entrada normalizados
      const normalizedInput = lastConcursoNumbers.map(n => n / 25);
      const inputTensor = tf.tensor2d([normalizedInput]);

      // Gera 8 jogos diferentes
      for (let i = 0; i < 8; i++) {
        // Aplica uma pequena variação aleatória nos pesos para cada jogo
        const weightVariation = champion.weights.map(w => 
          w * (1 + (Math.random() - 0.5) * 0.1)
        );

        // Faz a previsão usando o modelo treinado
        const prediction = await trainedModel.predict(inputTensor) as tf.Tensor;
        const predictionArray = Array.from(await prediction.data());

        // Aplica os pesos do campeão com variação
        const weightedNumbers = Array.from({ length: 25 }, (_, idx) => ({
          number: idx + 1,
          weight: predictionArray[idx % predictionArray.length] * 
                 (weightVariation[idx % weightVariation.length] / 1000)
        }));

        // Ordena por peso e seleciona os 15 maiores
        const selectedNumbers = weightedNumbers
          .sort((a, b) => b.weight - a.weight)
          .slice(0, 15)
          .map(n => n.number)
          .sort((a, b) => a - b);

        // Calcula a estimativa de acerto baseada no histórico do campeão
        const estimatedAccuracy = Math.min(
          ((champion.fitness / 15) * 100) + (Math.random() * 5),
          93.33
        );

        newPredictions.push({
          numbers: selectedNumbers,
          estimatedAccuracy
        });

        prediction.dispose();
      }

      inputTensor.dispose();
      setPredictions(newPredictions);

      toast({
        title: "Previsões Geradas",
        description: "8 jogos foram gerados com sucesso!"
      });
    } catch (error) {
      console.error("Erro ao gerar previsões:", error);
      toast({
        title: "Erro",
        description: "Erro ao gerar previsões: " + (error instanceof Error ? error.message : "Erro desconhecido"),
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Previsões do Campeão</span>
          <Button onClick={generatePredictions} className="bg-green-600 hover:bg-green-700">
            Gerar 8 Jogos
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {predictions.length > 0 ? (
          <div className="space-y-4">
            {predictions.map((pred, idx) => (
              <div key={idx} className="p-4 bg-gray-100 rounded-lg dark:bg-gray-800">
                <div className="font-semibold mb-2">Jogo {idx + 1}</div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {pred.numbers.map((num, numIdx) => (
                    <span key={numIdx} className="bg-blue-500 text-white px-3 py-1 rounded-full">
                      {num.toString().padStart(2, '0')}
                    </span>
                  ))}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Estimativa de Acertos: {pred.estimatedAccuracy.toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400">
            Clique no botão para gerar 8 previsões para o próximo concurso
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChampionPredictions;