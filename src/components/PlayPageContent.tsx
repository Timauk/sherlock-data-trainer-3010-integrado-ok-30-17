import React from 'react';
import DataUploader from '@/components/DataUploader';
import GameControls from '@/components/GameControls';
import GameBoard from '@/components/GameBoard';
import EnhancedLogDisplay from '@/components/EnhancedLogDisplay';
import NeuralNetworkVisualization from '@/components/NeuralNetworkVisualization';
import ModelMetrics from '@/components/ModelMetrics';
import LunarAnalysis from '@/components/LunarAnalysis';
import FrequencyAnalysis from '@/components/FrequencyAnalysis';
import ChampionPredictions from '@/components/ChampionPredictions';
import EvolutionStats from '@/components/EvolutionStats';
import PlayerDetails from '@/components/PlayerDetails';
import AdvancedAnalysis from '@/components/AdvancedAnalysis';
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useGameLogic } from '@/hooks/useGameLogic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PlayPageContentProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onThemeToggle: () => void;
  onCsvUpload: (file: File) => void;
  onModelUpload: (jsonFile: File, weightsFile: File) => void;
  onSaveModel: () => void;
  progress: number;
  generation: number;
  gameLogic: ReturnType<typeof useGameLogic>;
}

export const PlayPageContent: React.FC<PlayPageContentProps> = ({
  isPlaying,
  onPlay,
  onPause,
  onReset,
  onThemeToggle,
  onCsvUpload,
  onModelUpload,
  onSaveModel,
  progress,
  generation,
  gameLogic
}) => {
  const champion = gameLogic.players.reduce((prev, current) => 
    (current.fitness > prev.fitness) ? current : prev, 
    gameLogic.players[0]
  );

  const generationStats = gameLogic.evolutionData.reduce((acc, curr) => {
    const genData = acc.find(g => g.generation === curr.generation);
    if (genData) {
      genData.scores.push(curr.score);
    } else {
      acc.push({ generation: curr.generation, scores: [curr.score] });
    }
    return acc;
  }, [] as Array<{ generation: number; scores: number[] }>)
  .map(gen => ({
    generation: gen.generation,
    averageScore: gen.scores.reduce((a, b) => a + b, 0) / gen.scores.length,
    bestScore: Math.max(...gen.scores),
    worstScore: Math.min(...gen.scores)
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <DataUploader 
            onCsvUpload={onCsvUpload} 
            onModelUpload={onModelUpload} 
            onSaveModel={onSaveModel} 
          />

          <GameControls
            isPlaying={isPlaying}
            onPlay={onPlay}
            onPause={onPause}
            onReset={onReset}
            onThemeToggle={onThemeToggle}
          />

          <Button onClick={gameLogic.toggleInfiniteMode}>
            {gameLogic.isInfiniteMode ? 'Desativar' : 'Ativar'} Modo Infinito
          </Button>

          <EvolutionStats
            gameCount={gameLogic.gameCount}
            nextCloneAt={1000}
            generationStats={generationStats}
          />
        </div>

        <div className="space-y-4">
          <PlayerDetails 
            player={champion}
            historicalPerformance={gameLogic.evolutionData
              .filter(data => data.playerId === champion.id)
              .map(data => ({
                generation: data.generation,
                score: data.score,
                matches: data.fitness
              }))}
          />

          <ChampionPredictions
            champion={champion}
            trainedModel={gameLogic.trainedModel}
            lastConcursoNumbers={gameLogic.boardNumbers}
            onSaveModel={onSaveModel}
          />
        </div>
      </div>

      <Tabs defaultValue="game" className="w-full">
        <TabsList>
          <TabsTrigger value="game">Jogo</TabsTrigger>
          <TabsTrigger value="analysis">Análise</TabsTrigger>
          <TabsTrigger value="neural">Rede Neural</TabsTrigger>
        </TabsList>

        <TabsContent value="game">
          <div className="space-y-4">
            <GameBoard
              boardNumbers={gameLogic.boardNumbers}
              concursoNumber={gameLogic.concursoNumber}
              players={gameLogic.players}
              evolutionData={gameLogic.evolutionData}
            />
            
            <EnhancedLogDisplay logs={gameLogic.logs} />
          </div>
        </TabsContent>

        <TabsContent value="analysis">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <LunarAnalysis 
              dates={gameLogic.dates} 
              numbers={gameLogic.numbers}
              recentResults={100}
            />
            
            <FrequencyAnalysis 
              numbers={gameLogic.numbers}
              onFrequencyUpdate={gameLogic.updateFrequencyData}
            />

            <AdvancedAnalysis
              numbers={gameLogic.numbers}
              dates={gameLogic.dates}
            />

            <ModelMetrics
              accuracy={gameLogic.modelMetrics.accuracy}
              randomAccuracy={gameLogic.modelMetrics.randomAccuracy}
              totalPredictions={gameLogic.modelMetrics.totalPredictions}
            />
          </div>
        </TabsContent>

        <TabsContent value="neural">
          <div className="space-y-4">
            <NeuralNetworkVisualization 
              layers={[15, 64, 32, 15]} 
              inputData={gameLogic.neuralNetworkVisualization?.input}
              outputData={gameLogic.neuralNetworkVisualization?.output}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
