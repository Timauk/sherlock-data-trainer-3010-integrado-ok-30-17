import React from 'react';
import DataUploader from '@/components/DataUploader';
import GameControls from '@/components/GameControls';
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
import { Card } from "@/components/ui/card";
import EvolutionChart from '@/components/EvolutionChart';

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
  onPlayersChange: (count: number) => void;
  currentPlayerCount?: number;
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
  const nextCloneAt = 1000;
  
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
        <TabsList className="w-full">
          <TabsTrigger value="game">Jogo</TabsTrigger>
          <TabsTrigger value="analysis">Análise</TabsTrigger>
          <TabsTrigger value="predictions">Previsões</TabsTrigger>
          <TabsTrigger value="advanced">Avançado</TabsTrigger>
        </TabsList>

        <TabsContent value="game">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Números do Concurso</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {gameLogic.boardNumbers.map((number, index) => (
                  <span key={index} className="inline-block bg-primary text-primary-foreground rounded-full px-3 py-1 text-sm font-semibold">
                    {number}
                  </span>
                ))}
              </div>
              
              <h3 className="text-lg font-semibold mb-4">Jogadores Ativos</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {gameLogic.players.map((player) => (
                  <div key={player.id} className="p-3 bg-muted rounded-lg">
                    <p className="font-medium">Jogador {player.id}</p>
                    <p className="text-sm">Pontuação: {player.score}</p>
                    <div className="mt-2">
                      <p className="text-xs font-medium mb-1">Previsões:</p>
                      <div className="flex flex-wrap gap-1">
                        {player.predictions.map((num, idx) => (
                          <span key={idx} className="inline-block bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 text-xs">
                            {num}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs font-medium mb-1">Pesos:</p>
                      <div className="text-xs text-muted-foreground">
                        {player.weights.map((weight, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>Peso {idx + 1}:</span>
                            <span>{weight.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            
            <div className="space-y-4">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Evolução dos Jogadores</h3>
                <EvolutionChart data={gameLogic.evolutionData} />
              </Card>
              
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Logs em Tempo Real</h3>
                <div className="bg-muted p-4 rounded-lg h-[400px] overflow-y-auto">
                  {gameLogic.logs.map((log, index) => (
                    <p key={index} className={`mb-2 ${log.matches ? 'text-green-600 dark:text-green-400 font-medium' : ''}`}>
                      {log.message}
                    </p>
                  ))}
                </div>
              </Card>
            </div>
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
              perGameAccuracy={gameLogic.modelMetrics.perGameAccuracy}
              perGameRandomAccuracy={gameLogic.modelMetrics.perGameRandomAccuracy}
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