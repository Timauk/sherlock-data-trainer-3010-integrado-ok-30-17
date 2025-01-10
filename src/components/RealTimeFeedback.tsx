import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { enhancedGameSystem } from '@/utils/enhancedGameSystem';

interface RealTimeFeedbackProps {
  accuracy: number;
  predictionConfidence: number;
  processingSpeed: number;
  memoryUsage: number;
}

const RealTimeFeedback: React.FC<RealTimeFeedbackProps> = ({
  accuracy,
  predictionConfidence,
  processingSpeed,
  memoryUsage
}) => {
  React.useEffect(() => {
    enhancedGameSystem.updateMetrics({
      accuracy,
      confidence: predictionConfidence,
      processingSpeed,
      memoryUsage
    });
  }, [accuracy, predictionConfidence, processingSpeed, memoryUsage]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Feedback em Tempo Real</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Precisão do Modelo</span>
            <span>{accuracy.toFixed(2)}%</span>
          </div>
          <Progress value={accuracy} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Confiança da Previsão</span>
            <span>{predictionConfidence.toFixed(2)}%</span>
          </div>
          <Progress value={predictionConfidence} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Velocidade de Processamento</span>
            <span>{processingSpeed.toFixed(2)}%</span>
          </div>
          <Progress value={processingSpeed} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uso de Memória</span>
            <span>{memoryUsage.toFixed(2)}%</span>
          </div>
          <Progress value={memoryUsage} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
};

export default RealTimeFeedback;