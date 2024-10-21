import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ModelMetricsProps {
  accuracy: number;
  randomAccuracy: number;
  totalPredictions: number;
}

const ModelMetrics: React.FC<ModelMetricsProps> = ({ accuracy, randomAccuracy, totalPredictions }) => {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Métricas do Modelo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium">Precisão do Modelo</p>
            <p className="text-2xl font-bold">{(accuracy * 100).toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-sm font-medium">Precisão Aleatória</p>
            <p className="text-2xl font-bold">{(randomAccuracy * 100).toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-sm font-medium">Total de Previsões</p>
            <p className="text-2xl font-bold">{totalPredictions}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModelMetrics;