import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Player, ModelVisualization } from '@/types/gameTypes';
import FrequencyAnalysis from '../FrequencyAnalysis';
import LunarAnalysis from '../LunarAnalysis';
import NeuralNetworkVisualization from '../NeuralNetworkVisualization';

export interface AnalysisTabsProps {
  numbers: number[][];
  dates: Date[];
  players: Player[];
  boardNumbers: number[];
  concursoNumber: number;
  modelMetrics: {
    accuracy: number;
    randomAccuracy: number;
    totalPredictions: number;
  };
  neuralNetworkVisualization?: ModelVisualization;
  updateFrequencyData: (data: Record<string, number[]>) => void;
}

const AnalysisTabs: React.FC<AnalysisTabsProps> = ({
  numbers,
  dates,
  players,
  boardNumbers,
  concursoNumber,
  modelMetrics,
  neuralNetworkVisualization,
  updateFrequencyData
}) => {
  return (
    <Tabs defaultValue="frequency" className="w-full">
      <TabsList>
        <TabsTrigger value="frequency">Análise de Frequência</TabsTrigger>
        <TabsTrigger value="lunar">Análise Lunar</TabsTrigger>
        <TabsTrigger value="neural">Visualização Neural</TabsTrigger>
      </TabsList>
      
      <TabsContent value="frequency">
        <FrequencyAnalysis 
          numbers={numbers} 
          onFrequencyUpdate={updateFrequencyData}
          currentNumbers={boardNumbers}
        />
      </TabsContent>
      
      <TabsContent value="lunar">
        <LunarAnalysis 
          dates={dates}
          numbers={numbers}
        />
      </TabsContent>
      
      <TabsContent value="neural">
        <NeuralNetworkVisualization
          data={neuralNetworkVisualization}
          metrics={modelMetrics}
        />
      </TabsContent>
    </Tabs>
  );
};

export default AnalysisTabs;