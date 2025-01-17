import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { analyzeLunarPatterns } from '@/utils/lunarCalculations';

interface LunarAnalysisProps {
  dates: Date[];
  numbers: number[][];
  recentResults?: number;
}

const LunarAnalysis: React.FC<LunarAnalysisProps> = ({ 
  dates = [], 
  numbers = [], 
  recentResults = 100 
}) => {
  // Verifica se temos dados válidos
  if (!dates.length || !numbers.length) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Análise Lunar</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Sem dados disponíveis para análise</p>
        </CardContent>
      </Card>
    );
  }

  // Pega apenas os resultados mais recentes com verificação de limites
  const recentDates = dates.slice(-Math.min(recentResults, dates.length));
  const recentNumbers = numbers.slice(-Math.min(recentResults, numbers.length));
  
  const patterns = analyzeLunarPatterns(recentDates, recentNumbers);
  
  const chartData = Object.entries(patterns).flatMap(([phase, frequencies]) =>
    frequencies.map((freq, index) => ({
      number: index + 1,
      [phase]: freq,
    }))
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Análise Lunar (Últimos {recentResults} Sorteios)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="number" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="Nova" stroke="#8884d8" />
            <Line type="monotone" dataKey="Crescente" stroke="#82ca9d" />
            <Line type="monotone" dataKey="Cheia" stroke="#ffc658" />
            <Line type="monotone" dataKey="Minguante" stroke="#ff7300" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default LunarAnalysis;