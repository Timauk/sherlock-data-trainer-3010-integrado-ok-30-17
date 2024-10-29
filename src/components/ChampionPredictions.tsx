import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Player } from '@/types/gameTypes';
import * as tf from '@tensorflow/tfjs';
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const [predictions, setPredictions] = useState<Array<{ 
    numbers: number[], 
    estimatedAccuracy: number,
    confidence: number 
  }>>([]);
  const [isGenerating, setIsGenerating] = useState(false);
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

    setIsGenerating(true);

    try {
      const newPredictions = [];
      const normalizedInput = lastConcursoNumbers.map(n => n / 25);
      const inputTensor = tf.tensor2d([normalizedInput]);

      for (let i = 0; i < 8; i++) {
        const weightVariation = champion.weights.map(w => 
          w * (1 + (Math.random() - 0.5) * 0.1)
        );

        const prediction = await trainedModel.predict(inputTensor) as tf.Tensor;
        const predictionArray = Array.from(await prediction.data());

        const weightedNumbers = Array.from({ length: 25 }, (_, idx) => ({
          number: idx + 1,
          weight: predictionArray[idx % predictionArray.length] * 
                 (weightVariation[idx % weightVariation.length] / 1000),
          confidence: predictionArray[idx % predictionArray.length]
        }));

        const sortedNumbers = weightedNumbers.sort((a, b) => b.weight - a.weight);
        const selectedNumbers = sortedNumbers.slice(0, 15);
        
        const averageConfidence = selectedNumbers.reduce(
          (acc, curr) => acc + curr.confidence, 0
        ) / 15;

        const estimatedAccuracy = Math.min(
          ((champion.fitness / 15) * 100) + (Math.random() * 5),
          93.33
        );

        newPredictions.push({
          numbers: selectedNumbers.map(n => n.number).sort((a, b) => a - b),
          estimatedAccuracy,
          confidence: averageConfidence * 100
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
    } finally {
      setIsGenerating(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "bg-green-500";
    if (confidence >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Previsões do Campeão</span>
          <Button 
            onClick={generatePredictions} 
            className="bg-green-600 hover:bg-green-700"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              'Gerar 8 Jogos'
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {predictions.length > 0 ? (
          <div className="space-y-4">
            {predictions.map((pred, idx) => (
              <div key={idx} className="p-4 bg-secondary rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-semibold">Jogo {idx + 1}</div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge 
                          className={`${getConfidenceColor(pred.confidence)} text-white`}
                        >
                          {pred.confidence.toFixed(1)}% confiança
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Nível de confiança baseado nas análises do modelo</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {pred.numbers.map((num, numIdx) => (
                    <span 
                      key={numIdx} 
                      className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {num.toString().padStart(2, '0')}
                    </span>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  Estimativa de Acertos: {pred.estimatedAccuracy.toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            Clique no botão para gerar 8 previsões para o próximo concurso
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChampionPredictions;