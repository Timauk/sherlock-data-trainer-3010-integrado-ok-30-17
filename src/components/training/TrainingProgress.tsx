import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { trainingService } from '@/services/trainingService';

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
  const [totalGames, setTotalGames] = useState<number>(0);

  useEffect(() => {
    const fetchGamesCount = async () => {
      const count = await trainingService.getStoredGamesCount();
      setTotalGames(count);
    };

    fetchGamesCount();
  }, []);

  const lossData = trainingHistory.map((entry, index) => ({
    epoch: index + 1,
    loss: entry.metadata?.loss || 0,
    accuracy: entry.metadata?.accuracy || 0
  }));

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
              Progresso: {progress.toFixed(1)}%
            </p>
          </div>
        )}

        <div className="mt-4 space-y-4">
          <div className="bg-secondary p-4 rounded-lg">
            <h3 className="font-medium mb-2">Status do Treinamento</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total de Jogos Armazenados</p>
                <p className="text-2xl font-bold">{totalGames}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status do Modelo</p>
                <p className="text-lg font-medium">
                  {model ? 'Carregado e Pronto' : 'Não Carregado'}
                </p>
              </div>
            </div>
          </div>

          {lossData.length > 0 && (
            <div className="h-[300px]">
              <h3 className="font-medium mb-2">Histórico de Loss e Accuracy</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lossData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="epoch" label={{ value: 'Época', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'Valor', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="loss" 
                    stroke="#ef4444" 
                    name="Loss" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="accuracy" 
                    stroke="#10b981" 
                    name="Accuracy" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrainingProgress;