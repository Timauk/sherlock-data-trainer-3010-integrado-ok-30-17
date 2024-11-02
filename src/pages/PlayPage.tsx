import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import * as tf from '@tensorflow/tfjs';
import { useToast } from "@/hooks/use-toast";
import { useGameLogic } from '@/hooks/useGameLogic';
import { PlayPageHeader } from '@/components/PlayPageHeader';
import PlayPageContent from '@/components/PlayPageContent';
import { Slider } from "@/components/ui/slider";
import LotofacilLogger from '@/components/LotofacilLogger';
import { lotofacilService } from '@/services/lotofacilService';

const PlayPage: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [gameSpeed, setGameSpeed] = useState(1000); // Default 1 second
  const [csvData, setCsvData] = useState<number[][]>([]);
  const [csvDates, setCsvDates] = useState<Date[]>([]);
  const [trainedModel, setTrainedModel] = useState<tf.LayersModel | null>(null);
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const gameLogic = useGameLogic(csvData, trainedModel);

  const loadCSV = useCallback(async () => {
    try {
      const results = await lotofacilService.getLastResults();
      const processedData = results.map(result => ({
        concurso: result.concurso,
        data: new Date(result.data.split('/').reverse().join('-')),
        bolas: result.dezenas.map(Number)
      }));
      
      setCsvData(processedData.map(d => d.bolas));
      setCsvDates(processedData.map(d => d.data));
      gameLogic.addLog("Dados carregados da API com sucesso!");
      gameLogic.addLog(`Número de registros carregados: ${processedData.length}`);
    } catch (error) {
      gameLogic.addLog(`Erro ao carregar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }, [gameLogic]);

  useEffect(() => {
    loadCSV();
  }, [loadCSV]);

  const saveModel = useCallback(async () => {
    if (trainedModel) {
      try {
        await trainedModel.save('downloads://modelo-atual');
        gameLogic.addLog("Modelo salvo com sucesso!");
        toast({
          title: "Modelo Salvo",
          description: "O modelo atual foi salvo com sucesso.",
        });
      } catch (error) {
        gameLogic.addLog(`Erro ao salvar o modelo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        console.error("Detalhes do erro:", error);
        toast({
          title: "Erro ao Salvar Modelo",
          description: "Ocorreu um erro ao salvar o modelo. Verifique o console para mais detalhes.",
          variant: "destructive",
        });
      }
    } else {
      gameLogic.addLog("Nenhum modelo para salvar.");
      toast({
        title: "Nenhum Modelo",
        description: "Não há nenhum modelo carregado para salvar.",
        variant: "destructive",
      });
    }
  }, [trainedModel, gameLogic, toast]);

  const playGame = useCallback(() => {
    if (!trainedModel || csvData.length === 0) {
      gameLogic.addLog("Não é possível iniciar o jogo. Verifique se o modelo e os dados CSV foram carregados.");
      return;
    }
    setIsPlaying(true);
    gameLogic.addLog("Jogo iniciado.");
    gameLogic.gameLoop();
  }, [trainedModel, csvData, gameLogic]);

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

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isPlaying) {
      intervalId = setInterval(() => {
        gameLogic.gameLoop();
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
      }, gameSpeed);
    }
    return () => clearInterval(intervalId);
  }, [isPlaying, csvData, gameLogic, gameSpeed]);

  const handleSpeedChange = (value: number[]) => {
    const newSpeed = 2000 - value[0]; // Inverte a escala para que maior valor = mais rápido
    setGameSpeed(newSpeed);
    toast({
      title: "Velocidade Ajustada",
      description: `${newSpeed}ms por jogada`,
    });
  };

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
        onModelUpload={async () => {}}
        onSaveModel={saveModel}
        progress={progress}
        generation={gameLogic.generation}
        gameLogic={gameLogic}
      />
      {csvData.length > 0 && (
        <div className="mt-6">
          <LotofacilLogger numbers={csvData} dates={csvDates} />
        </div>
      )}
    </div>
  );
};

export default PlayPage;

