import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Player } from '@/types/gameTypes';
import * as tf from '@tensorflow/tfjs';
import NumberSelector from './NumberSelector';

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
  const [predictions, setPredictions] = useState<Array<{ numbers: number[], estimatedAccuracy: number, targetMatches: number, matchesWithSelected: number, isNeuralReduced?: boolean }>>([]);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const { toast } = useToast();

  const handleNumbersSelected = (numbers: number[]) => {
    setSelectedNumbers(numbers);
    if (predictions.length > 0) {
      setPredictions(predictions.map(pred => ({
        ...pred,
        matchesWithSelected: pred.numbers.filter(n => numbers.includes(n)).length
      })));
    }
  };

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
      // Primeiros 8 jogos (originais)
      const targets = [
        { matches: 11, count: 2 },
        { matches: 12, count: 2 },
        { matches: 13, count: 2 },
        { matches: 14, count: 1 },
        { matches: 15, count: 1 }
      ];
      
      // Gera os 8 jogos originais
      for (const target of targets) {
        for (let i = 0; i < target.count; i++) {
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
          
          const weightAdjustment = target.matches / 15;
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
            targetMatches: target.matches,
            matchesWithSelected: 0,
            isNeuralReduced: false
          });

          prediction.dispose();
          inputTensor.dispose();
        }
      }

      // Gera os 12 jogos adicionais com 80% do peso neural
      const additionalTargets = [
        { matches: 11, count: 3 },
        { matches: 12, count: 3 },
        { matches: 13, count: 3 },
        { matches: 14, count: 2 },
        { matches: 15, count: 1 }
      ];

      for (const target of additionalTargets) {
        for (let i = 0; i < target.count; i++) {
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
          
          // Aplica 80% do peso neural
          const neuralWeight = 0.8;
          const weightAdjustment = (target.matches / 15) * neuralWeight;
          
          const weightedNumbers = Array.from({ length: 25 }, (_, idx) => ({
            number: idx + 1,
            weight: (predictionArray[idx % predictionArray.length] * neuralWeight) * 
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
          
          const estimatedAccuracy = (target.matches / 15) * 100 * neuralWeight;
          
          newPredictions.push({
            numbers: selectedNumbers,
            estimatedAccuracy,
            targetMatches: target.matches,
            matchesWithSelected: 0,
            isNeuralReduced: true
          });

          prediction.dispose();
          inputTensor.dispose();
        }
      }

      // Adiciona a comparação com os números selecionados
      const predictionsWithMatches = newPredictions.map(pred => ({
        ...pred,
        matchesWithSelected: pred.numbers.filter(n => selectedNumbers.includes(n)).length
      }));

      setPredictions(predictionsWithMatches);
      
      toast({
        title: "Previsões Geradas",
        description: `20 jogos foram gerados! (8 originais + 12 com peso neural reduzido) ${isServerProcessing ? '(Processado no servidor)' : '(Processado no navegador)'}`
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
    <div className="space-y-4">
      <NumberSelector onNumbersSelected={handleNumbersSelected} />
      
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Previsões do Campeão {isServerProcessing ? '(Servidor)' : '(Local)'}</span>
            <Button onClick={generatePredictions} className="bg-green-600 hover:bg-green-700">
              Gerar 20 Jogos
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {predictions.length > 0 ? (
            <div className="space-y-4">
              {predictions.map((pred, idx) => (
                <div key={idx} className="p-4 bg-gray-100 rounded-lg dark:bg-gray-800">
                  <div className="font-semibold mb-2 flex justify-between items-center">
                    <span>Jogo {idx + 1} (Objetivo: {pred.targetMatches} acertos)</span>
                    {pred.isNeuralReduced && (
                      <span className="text-sm text-yellow-600 dark:text-yellow-400">
                        Peso Neural: 80%
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {pred.numbers.map((num, numIdx) => (
                      <span 
                        key={numIdx} 
                        className={`px-3 py-1 rounded-full ${
                          selectedNumbers.includes(num) 
                            ? 'bg-green-500 text-white' 
                            : 'bg-blue-500 text-white'
                        }`}
                      >
                        {num.toString().padStart(2, '0')}
                      </span>
                    ))}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <div>Estimativa de Acertos: {pred.estimatedAccuracy.toFixed(2)}%</div>
                    {selectedNumbers.length === 15 && (
                      <div className="mt-1 font-semibold text-green-600 dark:text-green-400">
                        Acertos com sua seleção: {pred.matchesWithSelected}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400">
              Clique no botão para gerar 20 previsões para o próximo concurso
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChampionPredictions;