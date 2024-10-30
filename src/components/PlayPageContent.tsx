import React from 'react';
import { Suspense, lazy } from 'react';
import DataUploader from '@/components/DataUploader';
import GameControls from '@/components/GameControls';
import GameBoard from '@/components/GameBoard';
import RealTimeFeedback from '@/components/RealTimeFeedback';
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useGameLogic } from '@/hooks/useGameLogic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import SystemDiagnostics from '@/components/SystemDiagnostics';

const EnhancedLogDisplay = lazy(() => import('@/components/EnhancedLogDisplay'));
const NeuralNetworkVisualization = lazy(() => import('@/components/NeuralNetworkVisualization'));
const ModelMetrics = lazy(() => import('@/components/ModelMetrics'));
const LunarAnalysis = lazy(() => import('@/components/LunarAnalysis'));
const FrequencyAnalysis = lazy(() => import('@/components/FrequencyAnalysis'));
const ChampionPredictions = lazy(() => import('@/components/ChampionPredictions'));
const EvolutionStats = lazy(() => import('@/components/EvolutionStats'));
const PlayerDetails = lazy(() => import('@/components/PlayerDetails'));
const AdvancedAnalysis = lazy(() => import('@/components/AdvancedAnalysis'));

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

const LoadingFallback = () => (
  <div className="w-full space-y-3">
    <Skeleton className="h-[125px] w-full rounded-xl" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-[250px]" />
      <Skeleton className="h-4 w-[200px]" />
    </div>
  </div>
);

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

  const generationStats = React.useMemo(() => gameLogic.evolutionData.reduce((acc, curr) => {
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
  })), [gameLogic.evolutionData]);

  return (
    <div className="flex flex-col gap-4">
      <Progress 
        value={progress} 
        showPercentage 
        label="Progresso da Geração Atual" 
        className="w-full"
      />
      
      <RealTimeFeedback
        accuracy={gameLogic.modelMetrics.accuracy * 100}
        predictionConfidence={champion.fitness * 100}
        processingSpeed={90}
        memoryUsage={75}
      />

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

          <div className="flex gap-2">
            <Button onClick={gameLogic.toggleInfiniteMode}>
              {gameLogic.isInfiniteMode ? 'Desativar' : 'Ativar'} Modo Infinito
            </Button>
            <Button 
              onClick={gameLogic.toggleManualMode}
              variant={gameLogic.isManualMode ? "destructive" : "outline"}
            >
              {gameLogic.isManualMode ? 'Desativar' : 'Ativar'} Modo Manual
            </Button>
          </div>

          <Suspense fallback={<LoadingFallback />}>
            <EvolutionStats
              gameCount={gameLogic.gameCount}
              nextCloneAt={1000}
              generationStats={generationStats}
            />
          </Suspense>
        </div>

        <div className="space-y-4">
          <Suspense fallback={<LoadingFallback />}>
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
            />
          </Suspense>
        </div>
      </div>

      <Tabs defaultValue="game" className="w-full">
        <TabsList>
          <TabsTrigger value="game">Jogo</TabsTrigger>
          <TabsTrigger value="analysis">Análise</TabsTrigger>
          <TabsTrigger value="neural">Rede Neural</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnóstico</TabsTrigger>
        </TabsList>

        <TabsContent value="game">
          <Suspense fallback={<LoadingFallback />}>
            <div className="space-y-4">
              <GameBoard
                boardNumbers={gameLogic.boardNumbers}
                concursoNumber={gameLogic.concursoNumber}
                players={gameLogic.players}
                evolutionData={gameLogic.evolutionData}
              />
              
              <EnhancedLogDisplay logs={gameLogic.logs} />
            </div>
          </Suspense>
        </TabsContent>

        <TabsContent value="analysis">
          <Suspense fallback={<LoadingFallback />}>
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
          </Suspense>
        </TabsContent>

        <TabsContent value="neural">
          <Suspense fallback={<LoadingFallback />}>
            <div className="space-y-4">
              <NeuralNetworkVisualization 
                layers={[15, 64, 32, 15]} 
                inputData={gameLogic.neuralNetworkVisualization?.input}
                outputData={gameLogic.neuralNetworkVisualization?.output}
              />
            </div>
          </Suspense>
        </TabsContent>

        <TabsContent value="diagnostics">
          <Suspense fallback={<LoadingFallback />}>
            <SystemDiagnostics />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlayPageContent;
