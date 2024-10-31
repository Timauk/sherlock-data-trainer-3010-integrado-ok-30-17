import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface PlayerComparisonProps {
  aiChampion: {
    score: number;
    matches: number;
  };
  traditionalPlayer: {
    score: number;
    matches: number;
  };
}

const PlayerComparison: React.FC<PlayerComparisonProps> = ({
  aiChampion,
  traditionalPlayer
}) => {
  const data = [
    { name: 'IA Campeão', value: aiChampion.matches },
    { name: 'Jogador Tradicional', value: traditionalPlayer.matches }
  ];

  const COLORS = ['#ffd700', '#3b82f6'];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Comparação de Desempenho</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-2">
          <p className="text-sm">
            Pontuação IA: {aiChampion.score}
          </p>
          <p className="text-sm">
            Pontuação Tradicional: {traditionalPlayer.score}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerComparison;