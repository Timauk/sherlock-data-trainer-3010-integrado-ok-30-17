import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import GameControls from '@/components/GameControls';
import GameBoard from '@/components/GameBoard';
import EnhancedLogDisplay from '@/components/EnhancedLogDisplay';
import NeuralNetworkVisualization from '@/components/NeuralNetworkVisualization';
import ModelMetrics from '@/components/ModelMetrics';
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useGameLogic } from '@/hooks/useGameLogic';
import GameInitializer from '@/components/GameInitializer';
import DataLoader from '@/components/DataLoader';

const PlayPage: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [csvData, setCsvData] = useState<number[][]>([]);
  const { theme, setTheme } = useTheme();

  const {
    players,
    generation,
    evolutionData,
    boardNumbers,
    concursoNumber,
    isInfiniteMode,
    setIsInfiniteMode,
    initializePlayers,
    gameLoop,
    evolveGeneration,
    neuralNetworkVisualization,
    modelMetrics,
    logs,
    addLog,
    trainedModel,
    setTrainedModel
  } = useGameLogic(csvData, null);

  const playGame = () => {
    if (csvData.length === 0 || !trainedModel) {
      addLog("Não é possível iniciar o jogo. Verifique se o modelo e os dados CSV foram carregados.");
      return;
    }
    setIsPlaying(true);
    addLog("Jogo iniciado.");
    gameLoop();
  };

  const pauseGame = () => {
    setIsPlaying(false);
    addLog("Jogo pausado.");
  };

  const resetGame = () => {
    setIsPlaying(false);
    setProgress(0);
    initializePlayers();
    addLog("Jogo reiniciado.");
  };

  const toggleInfiniteMode = () => {
    setIsInfiniteMode(!isInfiniteMode);
    addLog(`Modo infinito ${!isInfiniteMode ? 'ativado' : 'desativado'}.`);
  };

  React.useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isPlaying) {
      intervalId = setInterval(() => {
        gameLoop();
        setProgress((prevProgress) => {
          const newProgress = prevProgress + (100 / csvData.length);
          if (newProgress >= 100) {
            evolveGeneration();
            return isInfiniteMode ? 0 : 100;
          }
          return newProgress;
        });
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [isPlaying, csvData, gameLoop, evolveGeneration, isInfiniteMode]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 neon-title">SHERLOK</h2>
      
      <GameInitializer
        csvData={csvData}
        trainedModel={trainedModel}
        initializePlayers={initializePlayers}
        addLog={addLog}
        setTrainedModel={setTrainedModel}
      />

      <DataLoader
        onCsvUpload={setCsvData}
        addLog={addLog}
        setTrainedModel={setTrainedModel}
        trainedModel={trainedModel}
      />

      <GameControls
        isPlaying={isPlaying}
        onPlay={playGame}
        onPause={pauseGame}
        onReset={resetGame}
        onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      />

      <Button onClick={toggleInfiniteMode} className="mt-2">
        {isInfiniteMode ? 'Desativar' : 'Ativar'} Modo Infinito
      </Button>

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Progresso da Geração {generation}</h3>
        <Progress value={progress} className="w-full" />
      </div>

      <ModelMetrics
        accuracy={modelMetrics.accuracy}
        randomAccuracy={modelMetrics.randomAccuracy}
        totalPredictions={modelMetrics.totalPredictions}
      />

      <GameBoard
        boardNumbers={boardNumbers}
        concursoNumber={concursoNumber}
        players={players}
        evolutionData={evolutionData}
      />
      
      <EnhancedLogDisplay logs={logs} />

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Visualização da Rede Neural</CardTitle>
        </CardHeader>
        <CardContent>
          {neuralNetworkVisualization ? (
            <NeuralNetworkVisualization
              input={neuralNetworkVisualization.input}
              output={neuralNetworkVisualization.output}
              weights={neuralNetworkVisualization.weights}
            />
          ) : (
            <p>Aguardando dados da rede neural...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlayPage;