import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Player } from '@/types/gameTypes';

interface GeneticTreeVisualizationProps {
  players: Player[];
  generation: number;
}

const GeneticTreeVisualization: React.FC<GeneticTreeVisualizationProps> = ({ players, generation }) => {
  const genealogyData = players.map(player => ({
    id: player.id,
    generation: player.generation,
    score: player.score,
    fitness: player.fitness,
  }));

  return (
    <Card className="w-full mt-4">
      <CardHeader>
        <CardTitle>Árvore Genealógica dos Jogadores</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={genealogyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="generation" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="score" stroke="#8884d8" name="Pontuação" />
              <Line type="monotone" dataKey="fitness" stroke="#82ca9d" name="Fitness" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeneticTreeVisualization;