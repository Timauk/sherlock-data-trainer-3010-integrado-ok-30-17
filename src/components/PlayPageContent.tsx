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
  onPlayersChange?: (count: number) => void;
}

const PlayPageContent: React.FC<PlayPageContentProps> = ({
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
  gameLogic,
  onPlayersChange
}) => {
  const selectedPlayer = gameLogic.players[0] || null;
  const nextCloneAt = 1000; // Example value, adjust as needed
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
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
          onPlayersChange={onPlayersChange}
        />
      </div>

      <Progress value={progress} className="w-full" />

      <Tabs defaultValue="game" className="w-full">
        <TabsList>
          <TabsTrigger value="game">Jogo</TabsTrigger>
          <TabsTrigger value="analysis">Análise</TabsTrigger>
          <TabsTrigger value="predictions">Previsões</TabsTrigger>
          <TabsTrigger value="advanced">Avançado</TabsTrigger>
        </TabsList>

        <TabsContent value="game">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NeuralNetworkVisualization
              layers={[17, 64, 32, 15]}
              inputData={gameLogic.neuralNetworkVisualization?.input}
              outputData={gameLogic.neuralNetworkVisualization?.output}
            />
            <ModelMetrics
              accuracy={gameLogic.modelMetrics.accuracy}
              randomAccuracy={gameLogic.modelMetrics.randomAccuracy}
              totalPredictions={gameLogic.modelMetrics.totalPredictions}
              perGameAccuracy={0}
              perGameRandomAccuracy={0}
            />
            <LunarAnalysis
              dates={gameLogic.dates}
              numbers={gameLogic.numbers}
            />
            <FrequencyAnalysis
              numbers={gameLogic.numbers}
              onFrequencyUpdate={(freq) => console.log('Frequency updated:', freq)}
            />
          </div>
        </TabsContent>

        <TabsContent value="predictions">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ChampionPredictions
              champion={selectedPlayer}
              trainedModel={gameLogic.trainedModel}
              lastConcursoNumbers={gameLogic.boardNumbers}
            />
            <EvolutionStats
              gameCount={gameLogic.gameCount}
              nextCloneAt={nextCloneAt}
              generationStats={gameLogic.evolutionData.map(data => ({
                generation: data.generation,
                averageScore: data.score,
                bestScore: data.score + data.fitness,
                worstScore: data.score - data.fitness
              }))}
            />
          </div>
        </TabsContent>

        <TabsContent value="advanced">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PlayerDetails
              player={selectedPlayer}
              historicalPerformance={gameLogic.evolutionData.map(data => ({
                generation: data.generation,
                score: data.score,
                matches: data.fitness
              }))}
            />
            <AdvancedAnalysis
              numbers={gameLogic.numbers}
              dates={gameLogic.dates}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlayPageContent;