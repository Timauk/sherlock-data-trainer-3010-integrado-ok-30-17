import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

interface FrequencyAnalysisProps {
  numbers: number[][];
  onFrequencyUpdate: (data: Record<string, number[]>) => void;
  currentNumbers: number[];
}

const FrequencyAnalysis: React.FC<FrequencyAnalysisProps> = ({
  numbers,
  onFrequencyUpdate,
  currentNumbers
}) => {
  const frequencyData: Record<string, number[]> = {};

  numbers.forEach((numberSet) => {
    numberSet.forEach((number) => {
      const key = number.toString();
      if (!frequencyData[key]) {
        frequencyData[key] = [];
      }
      frequencyData[key].push(numberSet);
    });
  });

  React.useEffect(() => {
    onFrequencyUpdate(frequencyData);
  }, [numbers, onFrequencyUpdate]);

  return (
    <Card>
      <CardContent>
        <h3 className="text-lg font-semibold">Análise de Frequência</h3>
        <div className="grid gap-2">
          {Object.entries(frequencyData).map(([number, sets]) => (
            <div 
              key={number} 
              className={`p-2 rounded ${
                currentNumbers.includes(Number(number)) 
                  ? "bg-green-100 dark:bg-green-900" 
                  : "bg-gray-50 dark:bg-gray-800"
              }`}
            >
              <span className="font-medium">{number}: </span>
              <span>{sets.length} ocorrências</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FrequencyAnalysis;