import React, { useState, useCallback, useEffect } from 'react';
import { useTheme } from 'next-themes';
import * as tf from '@tensorflow/tfjs';
import { useToast } from "@/hooks/use-toast";
import { useGameLogic } from '@/hooks/useGameLogic';
import { useGameDirectory } from '@/hooks/useGameDirectory';
import { PlayPageHeader } from '@/components/PlayPageHeader';
import { PlayPageContent } from '@/components/PlayPageContent';
import GameInitializer from '@/components/GameInitializer';
import { Slider } from "@/components/ui/slider";
import { saveGame, loadGame } from '@/utils/saveSystem';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PlayPage: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [gameSpeed, setGameSpeed] = useState(1000);
  const [csvData, setCsvData] = useState<number[][]>([]);
  const [csvDates, setCsvDates] = useState<Date[]>([]);
  const [trainedModel, setTrainedModel] = useState<tf.LayersModel | null>(null);
  const [gameCount, setGameCount] = useState(0);
  const [concursoNumber, setConcursoNumber] = useState(0);
  const [autoSaveInterval, setAutoSaveInterval] = useState(5);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);

  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const gameLogic = useGameLogic(csvData, trainedModel);
  const { saveDirectory, selectDirectory } = useGameDirectory();

  const loadCSV = useCallback(async (file: File) => {
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
      setCsvDates(data.map(d => d.data));
      toast({
        title: "CSV Carregado",
        description: `${data.length} registros processados com sucesso.`
      });
    } catch (error) {
      toast({
        title: "Erro ao Carregar CSV",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive"
      });
    }
  }, [toast]);

  const loadModel = useCallback(async (jsonFile: File, weightsFile: File) => {
    try {
      const model = await tf.loadLayersModel(tf.io.browserFiles([jsonFile, weightsFile]));
      setTrainedModel(model);
      toast({
        title: "Modelo Carregado",
        description: "O modelo foi carregado com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro ao Carregar Modelo",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive"
      });
    }
  }, [toast]);

  const saveModel = useCallback(async () => {
    if (!trainedModel) {
      toast({
        title: "Erro",
        description: "Nenhum modelo para salvar",
        variant: "destructive"
      });
      return;
    }
    try {
      await trainedModel.save('downloads://modelo-atual');
      toast({
        title: "Modelo Salvo",
        description: "Modelo salvo com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro ao Salvar",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive"
      });
    }
  }, [trainedModel, toast]);

  const performAutoSave = useCallback(async () => {
    if (!saveDirectory && !localStorage) {
      toast({
        title: "Erro",
        description: "Nenhum local de salvamento disponível",
        variant: "destructive"
      });
      return;
    }

    try {
      await saveGame(
        gameLogic.players,
        gameLogic.generation,
        gameCount,
        gameLogic.evolutionData,
        trainedModel,
        concursoNumber,
        {}
      );
      setLastSaveTime(new Date());
      toast({
        title: "Checkpoint Salvo",
        description: `Progresso salvo com sucesso às ${new Date().toLocaleTimeString()}`
      });
    } catch (error) {
      toast({
        title: "Erro ao Salvar",
        description: "Não foi possível salvar o checkpoint",
        variant: "destructive"
      });
    }
  }, [gameLogic, trainedModel, gameCount, concursoNumber, saveDirectory, toast]);

  const playGame = useCallback(() => {
    if (!saveDirectory && 'showDirectoryPicker' in window) {
      selectDirectory().then(() => setIsPlaying(true));
    } else {
      setIsPlaying(true);
    }
  }, [saveDirectory, selectDirectory]);

  const pauseGame = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const resetGame = useCallback(() => {
    setIsPlaying(false);
    setProgress(0);
    gameLogic.initializePlayers();
  }, [gameLogic]);

  const handleSpeedChange = useCallback((value: number[]) => {
    const newSpeed = 2000 - value[0];
    setGameSpeed(newSpeed);
    toast({
      title: "Velocidade Ajustada",
      description: `${newSpeed}ms por jogada`
    });
  }, [toast]);

  useEffect(() => {
    const loadSavedGame = async () => {
      const savedGame = await loadGame(trainedModel);
      if (savedGame) {
        gameLogic.initializePlayers();
        setGameCount(savedGame.gameCount);
        setConcursoNumber(savedGame.concursoNumber);
        setLastSaveTime(new Date(savedGame.timestamp));
        toast({
          title: "Checkpoint Carregado",
          description: "Progresso anterior restaurado com sucesso!"
        });
      }
    };
    loadSavedGame();
  }, [trainedModel, gameLogic, toast]);

  useEffect(() => {
    const interval = setInterval(performAutoSave, autoSaveInterval * 60 * 1000);
    return () => clearInterval(interval);
  }, [autoSaveInterval, performAutoSave]);

  return (
    <div className="p-6">
      <PlayPageHeader />
      
      <GameInitializer 
        onSelectDirectory={selectDirectory}
        onStart={playGame}
      />

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Configurações de Autosave</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">
                Intervalo de Autosave: {autoSaveInterval} minutos
              </p>
              <Slider
                defaultValue={[autoSaveInterval]}
                min={1}
                max={60}
                step={1}
                onValueChange={(value) => setAutoSaveInterval(value[0])}
              />
            </div>
            {lastSaveTime && (
              <p className="text-sm text-muted-foreground">
                Último save: {lastSaveTime.toLocaleString()}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

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
        generation={gameLogic.generation}
        gameLogic={gameLogic}
      />
    </div>
  );
};

export default PlayPage;
