import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

interface FrequencyAnalysisProps {
  numbers: number[][];
  onFrequencyUpdate: (data: Record<string, number[]>) => void;
  currentNumbers: number[];
}

const FrequencyAnalysis: React.FC<FrequencyAnalysisProps> = ({
  numbers,
  onFrequencyUpdate: onUpdate,
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
    onUpdate(frequencyData);
  }, [numbers, onUpdate]);

  return (
    <Card>
      <CardContent>
        <h3 className="text-lg font-semibold">Análise de Frequência</h3>
        <div>
          {Object.entries(frequencyData).map(([number, sets]) => (
            <div key={number} className={currentNumbers.includes(parseInt(number)) ? "bg-green-100 p-2" : "p-2"}>
              <span>{number}: </span>
              <span>{sets.length} ocorrências</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FrequencyAnalysis;