import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

interface FrequencyAnalysisProps {
  numbers: number[][];
  updateFrequencyData: (data: Record<string, number[]>) => void;
  currentNumbers: number[];
}

const FrequencyAnalysis: React.FC<FrequencyAnalysisProps> = ({
  numbers = [],
  updateFrequencyData,
  currentNumbers = []
}) => {
  const frequencyData: Record<string, number[]> = {};

  // Garantir que numbers existe e é um array antes de usar forEach
  if (Array.isArray(numbers)) {
    numbers.forEach((numberSet) => {
      if (Array.isArray(numberSet)) {
        numberSet.forEach((number) => {
          const key = number.toString();
          if (!frequencyData[key]) {
            frequencyData[key] = [];
          }
          frequencyData[key].push(number);
        });
      }
    });
  }

  React.useEffect(() => {
    if (typeof updateFrequencyData === 'function') {
      updateFrequencyData(frequencyData);
    }
  }, [numbers, updateFrequencyData]);

  return (
    <Card>
      <CardContent>
        <h3 className="text-lg font-semibold">Análise de Frequência</h3>
        <div className="grid gap-2">
          {Object.entries(frequencyData).map(([number, occurrences]) => (
            <div 
              key={number} 
              className={`p-2 rounded ${
                currentNumbers.includes(Number(number)) 
                  ? "bg-green-100 dark:bg-green-900" 
                  : "bg-gray-50 dark:bg-gray-800"
              }`}
            >
              <span className="font-medium">{number}: </span>
              <span>{occurrences.length} ocorrências</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FrequencyAnalysis;