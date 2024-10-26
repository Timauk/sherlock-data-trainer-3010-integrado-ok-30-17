import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface EvolutionStatsProps {
  gameCount: number;
  nextCloneAt: number;
  generationStats: Array<{
    generation: number;
    averageScore: number;
    bestScore: number;
    worstScore: number;
  }>;
}

const EvolutionStats: React.FC<EvolutionStatsProps> = ({
  gameCount,
  nextCloneAt,
  generationStats
}) => {
  const progress = (gameCount % nextCloneAt) / nextCloneAt * 100;
  const gamesUntilClone = nextCloneAt - (gameCount % nextCloneAt);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Progresso até Próxima Clonagem</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="w-full mb-2" />
          <p className="text-sm text-muted-foreground">
            Faltam {gamesUntilClone} jogos para próxima clonagem
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Evolução das Gerações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={generationStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="generation" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="bestScore" 
                  stroke="#10b981" 
                  name="Melhor Pontuação" 
                />
                <Line 
                  type="monotone" 
                  dataKey="averageScore" 
                  stroke="#6366f1" 
                  name="Média" 
                />
                <Line 
                  type="monotone" 
                  dataKey="worstScore" 
                  stroke="#ef4444" 
                  name="Pior Pontuação" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EvolutionStats;