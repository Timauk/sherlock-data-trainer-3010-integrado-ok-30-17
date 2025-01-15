import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import AdvancedAnalysis from '../AdvancedAnalysis';
import FrequencyAnalysis from '../FrequencyAnalysis';
import LunarAnalysis from '../LunarAnalysis';
import { Player, ModelVisualization } from '@/types/gameTypes';

interface AnalysisTabsProps {
  boardNumbers: number[];
  concursoNumber: number;
  players: Player[];
  evolutionData: Array<{
    generation: number;
    playerId: number;
    score: number;
    fitness: number;
  }>;
  dates: Date[];
  numbers: number[][];
  updateFrequencyData: (data: Record<string, number[]>) => void;
  modelMetrics: {
    accuracy: number;
    randomAccuracy: number;
    totalPredictions: number;
  };
  neuralNetworkVisualization?: ModelVisualization;
}

const AnalysisTabs: React.FC<AnalysisTabsProps> = ({
  boardNumbers,
  concursoNumber,
  players,
  evolutionData,
  dates,
  numbers,
  updateFrequencyData,
  modelMetrics,
  neuralNetworkVisualization
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
            updateFrequencyData={updateFrequencyData}
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
            dates={dates}
            modelMetrics={modelMetrics}
            neuralNetworkVisualization={neuralNetworkVisualization}
          />
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default AnalysisTabs;