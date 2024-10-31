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
  isServerProcessing?: boolean;
}

const ChampionPredictions: React.FC<ChampionPredictionsProps> = ({
  champion,
  trainedModel,
  lastConcursoNumbers,
  isServerProcessing = false
}) => {
  const [predictions, setPredictions] = useState<Array<{ numbers: number[], estimatedAccuracy: number, targetMatches: number }>>([]);
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
      // Distribuição dos jogos por objetivo de acertos
      const targets = [
        { matches: 11, count: 2 }, // 2 jogos mirando 11 acertos
        { matches: 12, count: 2 }, // 2 jogos mirando 12 acertos
        { matches: 13, count: 2 }, // 2 jogos mirando 13 acertos
        { matches: 14, count: 1 }, // 1 jogo mirando 14 acertos
        { matches: 15, count: 1 }  // 1 jogo mirando 15 acertos
      ];
      
      for (const target of targets) {
        for (let i = 0; i < target.count; i++) {
          // Ajusta a variação baseada no objetivo
          // Quanto menor o número de acertos desejado, maior a variação
          const variationFactor = 0.05 + ((15 - target.matches) * 0.02);
          
          const normalizedInput = [
            ...lastConcursoNumbers.slice(0, 15).map(n => {
              const variation = (Math.random() - 0.5) * variationFactor;
              return (n / 25) * (1 + variation);
            }),
            (champion.generation + i) / 1000,
            (Date.now() + i * 1000) / (1000 * 60 * 60 * 24 * 365)
          ];
          
          const inputTensor = tf.tensor2d([normalizedInput]);
          const prediction = await trainedModel.predict(inputTensor) as tf.Tensor;
          const predictionArray = Array.from(await prediction.data());
          
          // Ajusta os pesos baseado no objetivo
          const weightAdjustment = target.matches / 15; // Fator de ajuste baseado no objetivo
          const weightedNumbers = Array.from({ length: 25 }, (_, idx) => ({
            number: idx + 1,
            weight: predictionArray[idx % predictionArray.length] * 
                   (champion.weights[idx % champion.weights.length] / 1000) *
                   weightAdjustment *
                   (1 + (Math.random() - 0.5) * 0.2)
          }));
          
          const selectedNumbers = weightedNumbers
            .sort((a, b) => b.weight - a.weight)
            .slice(0, 20)
            .sort(() => Math.random() - 0.5)
            .slice(0, 15)
            .map(n => n.number)
            .sort((a, b) => a - b);
          
          const estimatedAccuracy = (target.matches / 15) * 100;
          
          newPredictions.push({
            numbers: selectedNumbers,
            estimatedAccuracy,
            targetMatches: target.matches
          });

          prediction.dispose();
          inputTensor.dispose();
        }
      }

      setPredictions(newPredictions);
      
      toast({
        title: "Previsões Geradas",
        description: `8 jogos foram gerados com diferentes objetivos de acertos! ${isServerProcessing ? '(Processado no servidor)' : '(Processado no navegador)'}`
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
          <span>Previsões do Campeão {isServerProcessing ? '(Servidor)' : '(Local)'}</span>
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
                <div className="font-semibold mb-2">
                  Jogo {idx + 1} (Objetivo: {pred.targetMatches} acertos)
                </div>
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