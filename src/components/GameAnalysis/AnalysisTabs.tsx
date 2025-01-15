import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import AdvancedAnalysis from '../AdvancedAnalysis';
import FrequencyAnalysis from '../FrequencyAnalysis';
import LunarAnalysis from '../LunarAnalysis';
import { ModelVisualization } from '@/types/gameTypes';

interface AnalysisTabsProps {
  numbers: number[][];
  dates: Date[];
  modelMetrics: {
    accuracy: number;
    randomAccuracy: number;
    totalPredictions: number;
  };
  neuralNetworkVisualization?: ModelVisualization;
  onFrequencyUpdate: (data: Record<string, number[]>) => void;
  boardNumbers: number[];
  concursoNumber: number;
}

const AnalysisTabs: React.FC<AnalysisTabsProps> = ({
  numbers,
  dates,
  modelMetrics,
  neuralNetworkVisualization,
  onFrequencyUpdate,
  boardNumbers,
  concursoNumber
}) => {
  return (
    <Card className="mt-4">
      <Tabs defaultValue="frequency" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="frequency">Análise de Frequência</TabsTrigger>
          <TabsTrigger value="lunar">Análise Lunar</TabsTrigger>
          <TabsTrigger value="advanced">Análise Avançada</TabsTrigger>
        </TabsList>
        
        <TabsContent value="frequency">
          <FrequencyAnalysis 
            numbers={numbers}
            onFrequencyUpdate={onFrequencyUpdate}
          />
        </TabsContent>
        
        <TabsContent value="lunar">
          <LunarAnalysis 
            dates={dates}
            numbers={numbers}
          />
        </TabsContent>
        
        <TabsContent value="advanced">
          <AdvancedAnalysis 
            numbers={numbers}
            modelMetrics={modelMetrics}
            neuralNetworkVisualization={neuralNetworkVisualization}
          />
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default AnalysisTabs;