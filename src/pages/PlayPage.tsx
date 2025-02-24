import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { useToast } from "@/hooks/use-toast";
import { useGameLogic } from '@/hooks/useGameLogic';
import { PlayPageHeader } from '@/components/PlayPageHeader';
import PlayPageContent from '@/components/PlayPageContent';
import { Slider } from "@/components/ui/slider";
import { useModelTraining } from '@/hooks/useModelTraining';
import { gameAnalysisSystem } from '@/utils/integrated/gameAnalysisSystem';

const PlayPage: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [gameSpeed, setGameSpeed] = useState(1000);
  const [csvData, setCsvData] = useState<number[][]>([]);
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  
  const { initializeModel } = useModelTraining();
  const gameLogic = useGameLogic(csvData, null);

  const loadCSV = useCallback(async (file: File) => {
    if (!file) {
      toast({
        title: "Erro",
        description: "Arquivo CSV não fornecido",
        variant: "destructive"
      });
      return;
    }

    try {
      const text = await file.text();
      const lines = text.trim().split('\n').slice(1);
      const data = lines.map(line => {
        const values = line.split(',');
        return {
          concurso: parseInt(values[0], 10),
          data: new Date(values[1].split('/').reverse().join('-')),
          bolas: values.slice(2).map(Number)
        };
      });
      setCsvData(data.map(d => d.bolas));
      gameLogic.addLog("CSV carregado e processado com sucesso!");
      gameLogic.addLog(`Número de registros carregados: ${data.length}`);
      
      toast({
        title: "Sucesso",
        description: `CSV carregado com ${data.length} registros`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      gameLogic.addLog(`Erro ao carregar CSV: ${errorMessage}`);
      
      toast({
        title: "Erro",
        description: `Falha ao carregar CSV: ${errorMessage}`,
        variant: "destructive"
      });
    }
  }, [gameLogic, toast]);

  const loadModel = useCallback(async (_jsonFile: File, _weightsFile: File) => {
    try {
      await initializeModel();
      gameLogic.addLog("Modelo carregado com sucesso!");
      toast({
        title: "Modelo Carregado",
        description: "O modelo foi carregado com sucesso.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      gameLogic.addLog(`Erro ao carregar o modelo: ${errorMessage}`);
      console.error("Detalhes do erro:", error);
      toast({
        title: "Erro ao Carregar Modelo",
        description: `Ocorreu um erro ao carregar o modelo: ${errorMessage}`,
        variant: "destructive",
      });
    }
  }, [gameLogic, toast, initializeModel]);

  const saveModel = useCallback(async () => {
    if (!gameLogic.trainedModel) {
      toast({
        title: "Erro",
        description: "Nenhum modelo para salvar",
        variant: "destructive"
      });
      return;
    }

    try {
      await gameLogic.trainedModel.save('downloads://modelo-atual');
      gameLogic.addLog("Modelo salvo com sucesso!");
      toast({
        title: "Modelo Salvo",
        description: "O modelo atual foi salvo com sucesso.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      gameLogic.addLog(`Erro ao salvar o modelo: ${errorMessage}`);
      console.error("Detalhes do erro:", error);
      toast({
        title: "Erro ao Salvar Modelo",
        description: `Ocorreu um erro ao salvar o modelo: ${errorMessage}`,
        variant: "destructive",
      });
    }
  }, [gameLogic, toast]);

  const playGame = useCallback(() => {
    if (!gameLogic.trainedModel || csvData.length === 0) {
      toast({
        title: "Erro",
        description: "Verifique se o modelo e os dados CSV foram carregados",
        variant: "destructive"
      });
      return;
    }
    setIsPlaying(true);
    gameLogic.addLog("Jogo iniciado.");
  }, [gameLogic, csvData.length, toast]);

  const pauseGame = useCallback(() => {
    setIsPlaying(false);
    gameLogic.addLog("Jogo pausado.");
  }, [gameLogic]);

  const resetGame = useCallback(() => {
    setIsPlaying(false);
    setProgress(0);
    gameLogic.initializePlayers();
    gameLogic.addLog("Jogo reiniciado.");
  }, [gameLogic]);

  const handleSpeedChange = useCallback((value: number[]) => {
    const newSpeed = 2000 - value[0];
    setGameSpeed(newSpeed);
    toast({
      title: "Velocidade Ajustada",
      description: `${newSpeed}ms por jogada`,
    });
  }, [toast]);

  useEffect(() => {
    initializeModel();
  }, [initializeModel]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isPlaying && gameLogic.trainedModel) {
      intervalId = setInterval(async () => {
        try {
          gameAnalysisSystem.getMetrics();
          setProgress((prevProgress) => {
            const newProgress = prevProgress + (100 / csvData.length);
            if (newProgress >= 100) {
              if (!gameLogic.isManualMode) {
                gameLogic.evolveGeneration();
              }
              return gameLogic.isInfiniteMode ? 0 : 100;
            }
            return newProgress;
          });
        } catch (error) {
          console.error('Erro no loop do jogo:', error);
          toast({
            title: "Erro",
            description: "Ocorreu um erro durante a execução do jogo",
            variant: "destructive"
          });
          setIsPlaying(false);
        }
      }, gameSpeed);
    }
    return () => clearInterval(intervalId);
  }, [isPlaying, csvData, gameLogic, gameSpeed, toast]);

  return (
    <div className="p-6">
      <PlayPageHeader />
      <div className="mb-4 p-4 bg-background rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">Controle de Velocidade</h3>
        <Slider
          defaultValue={[1000]}
          max={1900}
          min={100}
          step={100}
          onValueChange={handleSpeedChange}
          className="w-full"
        />
        <p className="text-sm text-muted-foreground mt-1">
          Intervalo atual: {gameSpeed}ms
        </p>
      </div>
      <PlayPageContent
        isPlaying={isPlaying}
        onPlay={playGame}
        onPause={pauseGame}
        onReset={resetGame}
        onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onCsvUpload={loadCSV}
        onModelUpload={loadModel}
        onSaveModel={saveModel}
        progress={progress}
        gameLogic={gameLogic}
      />
    </div>
  );
};

export default PlayPage;
