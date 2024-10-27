import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface EvolutionChartProps {
  data: Array<{
    generation: number;
    playerId: number;
    score: number;
    fitness: number;
  }>;
}

const EvolutionChart: React.FC<EvolutionChartProps> = ({ data = [] }) => {
  const playerIds = [...new Set(data.map(item => item.playerId))];
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a4de6c', '#d0ed57'];

  // Agrupa os dados por jogador e geração
  const processedData = playerIds.map(playerId => {
    const playerData = data
      .filter(item => item.playerId === playerId)
      .sort((a, b) => a.generation - b.generation);
    
    // Garante que temos apenas um registro por geração
    const uniqueGenerations = new Map();
    playerData.forEach(item => {
      uniqueGenerations.set(item.generation, item);
    });
    
    return Array.from(uniqueGenerations.values());
  }).flat();

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-2">Evolução das Gerações por Jogador</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="generation" 
            type="number"
            allowDecimals={false}
            domain={['dataMin', 'dataMax']}
            label={{ value: 'Geração', position: 'insideBottom', offset: -5 }}
          />
          <YAxis 
            label={{ 
              value: 'Pontuação', 
              angle: -90, 
              position: 'insideLeft',
              offset: 10
            }}
          />
          <Tooltip 
            formatter={(value: number) => [`${value} pontos`, 'Pontuação']}
            labelFormatter={(label: number) => `Geração ${label}`}
          />
          <Legend />
          {playerIds.map((playerId, index) => (
            <Line
              key={playerId}
              type="monotone"
              data={processedData.filter(item => item.playerId === playerId)}
              dataKey="score"
              name={`Jogador ${playerId}`}
              stroke={colors[index % colors.length]}
              dot={{ r: 4 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EvolutionChart;