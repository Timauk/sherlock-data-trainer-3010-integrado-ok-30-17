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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

const PlayPage: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [gameSpeed, setGameSpeed] = useState(1000);
  const [csvData, setCsvData] = useState<number[][]>([]);
  const [csvDates, setCsvDates] = useState<Date[]>([]);
  const [trainedModel, setTrainedModel] = useState<tf.LayersModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const gameLogic = useGameLogic(csvData, trainedModel);

  const loadCSV = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      
      console.log("Iniciando carregamento dos dados...");
      const results = await lotofacilService.getLastResults();
      
      if (!results || results.length === 0) {
        throw new Error("Nenhum resultado foi retornado da API");
      }

      console.log(`Dados recebidos: ${results.length} registros`);
      
      const processedData = results.map(result => ({
        concurso: result.concurso,
        data: new Date(result.data.split('/').reverse().join('-')),
        bolas: result.dezenas.map(Number)
      }));
      
      setCsvData(processedData.map(d => d.bolas));
      setCsvDates(processedData.map(d => d.data));
      
      gameLogic.addLog("Dados carregados da API com sucesso!");
      gameLogic.addLog(`Número de registros carregados: ${processedData.length}`);
      
      toast({
        title: "Dados Carregados",
        description: `${processedData.length} registros foram carregados com sucesso.`,
      });
    } catch (error) {
      console.error("Erro detalhado:", error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setLoadError(errorMessage);
      
      toast({
        title: "Erro ao Carregar Dados",
        description: "Não foi possível carregar os dados do jogo. Tente novamente.",
        variant: "destructive",
      });
      
      gameLogic.addLog(`Erro ao carregar dados: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [gameLogic, toast]);

  useEffect(() => {
    console.log("Iniciando carregamento inicial...");
    loadCSV();
  }, [loadCSV]);

  const playGame = useCallback(() => {
    if (!trainedModel || csvData.length === 0) {
      toast({
        title: "Não é possível iniciar",
        description: "Verifique se o modelo e os dados foram carregados corretamente.",
        variant: "destructive",
      });
      return;
    }
    setIsPlaying(true);
    gameLogic.addLog("Jogo iniciado.");
    gameLogic.gameLoop();
  }, [trainedModel, csvData, gameLogic, toast]);

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

  const handleSpeedChange = (value: number[]) => {
    const newSpeed = 2000 - value[0];
    setGameSpeed(newSpeed);
    toast({
      title: "Velocidade Ajustada",
      description: `${newSpeed}ms por jogada`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          <p className="text-lg">Carregando dados do jogo...</p>
          <p className="text-sm text-muted-foreground">Por favor, aguarde enquanto carregamos os resultados anteriores.</p>
        </div>
      </div>
    );
  }

  if (loadError || csvData.length === 0) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            {loadError || "Não foi possível carregar os dados do jogo. Por favor, tente novamente."}
          </AlertDescription>
        </Alert>
        <button
          onClick={loadCSV}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

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
        onSaveModel={async () => {}}
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