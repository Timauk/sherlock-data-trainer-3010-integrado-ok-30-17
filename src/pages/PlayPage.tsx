import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import * as tf from '@tensorflow/tfjs';
import { useToast } from "@/hooks/use-toast";
import { useGameLogic } from '@/hooks/useGameLogic';
import { PlayPageHeader } from '@/components/PlayPageHeader';
import { PlayPageContent } from '@/components/PlayPageContent';
import { Slider } from "@/components/ui/slider";
import { saveGame, loadGame } from '@/utils/saveSystem';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  const [autoSaveInterval, setAutoSaveInterval] = useState(5); // minutos
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);

  // Função para realizar o autosave
  const performAutoSave = useCallback(async () => {
    try {
      await saveGame(
        gameLogic.players,
        gameLogic.generation,
        gameCount,
        gameLogic.evolutionData,
        trainedModel,
        concursoNumber,
        gameLogic.frequencyData
      );
      setLastSaveTime(new Date());
      toast({
        title: "Checkpoint Salvo",
        description: `Progresso salvo com sucesso às ${new Date().toLocaleTimeString()}`,
      });
    } catch (error) {
      toast({
        title: "Erro ao Salvar",
        description: "Não foi possível salvar o checkpoint",
        variant: "destructive",
      });
    }
  }, [gameLogic, trainedModel, gameCount, concursoNumber, toast]);

  // Carregar save ao iniciar
  useEffect(() => {
    const loadSavedGame = async () => {
      const savedGame = await loadGame(trainedModel);
      if (savedGame) {
        setPlayers(savedGame.players);
        setGeneration(savedGame.generation);
        setGameCount(savedGame.gameCount);
        setEvolutionData(savedGame.evolutionData);
        setConcursoNumber(savedGame.concursoNumber);
        setLastSaveTime(new Date(savedGame.timestamp));
        
        toast({
          title: "Checkpoint Carregado",
          description: "Progresso anterior restaurado com sucesso!",
        });
      }
    };
    
    loadSavedGame();
  }, [trainedModel]);

  // Configurar autosave
  useEffect(() => {
    const interval = setInterval(performAutoSave, autoSaveInterval * 60 * 1000);
    return () => clearInterval(interval);
  }, [autoSaveInterval, performAutoSave]);

  return (
    <div className="p-6">
      <PlayPageHeader />
      
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
