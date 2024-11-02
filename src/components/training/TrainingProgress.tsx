import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface TrainingProgressProps {
  progress: number;
  model: any | null;
  trainingHistory: any[];
}

const TrainingProgress: React.FC<TrainingProgressProps> = ({
  progress,
  model,
  trainingHistory
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Progresso do Treinamento</CardTitle>
      </CardHeader>
      <CardContent>
        {progress > 0 && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground">
              Progresso: {progress}%
            </p>
          </div>
        )}

        {model && (
          <div className="bg-secondary p-4 rounded-lg mt-4">
            <p className="font-medium">Modelo Atual Carregado</p>
            <p className="text-sm text-muted-foreground">
              Pronto para fazer previsões
            </p>
          </div>
        )}

        {trainingHistory.length > 0 && (
          <div className="space-y-2 mt-4">
            <h3 className="font-medium">Histórico de Treinamentos</h3>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {trainingHistory.map((entry, index) => (
                <div key={index} className="bg-secondary/50 p-2 rounded">
                  <p className="text-sm">
                    Data: {new Date(entry.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm">
                    Precisão: {(entry.metadata.accuracy * 100).toFixed(2)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrainingProgress;