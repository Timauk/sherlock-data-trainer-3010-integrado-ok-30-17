import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Player } from '@/types/gameTypes';
import * as tf from '@tensorflow/tfjs';
import { predictNumbers } from '@/utils/tfUtils';

interface ChampionPredictionsProps {
  champion: Player | undefined;
  trainedModel: tf.LayersModel | null;
  lastConcursoNumbers: number[];
  onSaveModel: () => void;
}

const ChampionPredictions: React.FC<ChampionPredictionsProps> = ({
  champion,
  trainedModel,
  lastConcursoNumbers,
  onSaveModel
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
      // Primeiro salva o modelo
      await onSaveModel();
      toast({
        title: "Modelo Salvo",
        description: "O modelo foi salvo com sucesso antes de gerar as previsões."
      });

      const newPredictions = [];
      for (let i = 0; i < 5; i++) {
        const prediction = await predictNumbers(trainedModel, lastConcursoNumbers);
        const numbers = Array.from(await prediction.data())
          .map((n, idx) => ({ value: Math.round(n * 24) + 1, original: idx }))
          .sort((a, b) => a.value - b.value)
          .map(n => n.value);

        // Calcula estimativa de acerto baseada no histórico do campeão
        const estimatedAccuracy = (champion.fitness / 15) * 100;
        
        newPredictions.push({
          numbers,
          estimatedAccuracy: Math.min(estimatedAccuracy, 93.33) // Máximo de 14/15 = 93.33%
        });

        prediction.dispose();
      }

      setPredictions(newPredictions);
      
      toast({
        title: "Previsões Geradas",
        description: "5 jogos foram gerados com base no conhecimento do campeão!"
      });
    } catch (error) {
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
            Gerar 5 Jogos
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {predictions.length > 0 ? (
          <div className="space-y-4">
            {predictions.map((pred, idx) => (
              <div key={idx} className="p-4 bg-gray-100 rounded-lg">
                <div className="font-semibold mb-2">Jogo {idx + 1}</div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {pred.numbers.map((num, numIdx) => (
                    <span key={numIdx} className="bg-blue-500 text-white px-3 py-1 rounded-full">
                      {num.toString().padStart(2, '0')}
                    </span>
                  ))}
                </div>
                <div className="text-sm text-gray-600">
                  Estimativa para 14 acertos: {pred.estimatedAccuracy.toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500">
            Clique no botão para gerar previsões baseadas no último concurso
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChampionPredictions;