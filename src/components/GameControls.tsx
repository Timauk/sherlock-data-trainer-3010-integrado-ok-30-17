import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Moon, Cpu, Zap } from 'lucide-react';
import * as tf from '@tensorflow/tfjs';
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";

interface GameControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onThemeToggle: () => void;
  onPlayersChange: (count: number) => void;
  currentPlayerCount?: number;
}

const GameControls: React.FC<GameControlsProps> = ({
  isPlaying,
  onPlay,
  onPause,
  onReset,
  onThemeToggle,
  onPlayersChange,
  currentPlayerCount = 10
}) => {
  const [gpuEnabled, setGpuEnabled] = useState(false);
  const [playerCount, setPlayerCount] = useState(currentPlayerCount);
  const { toast } = useToast();

  const toggleGPU = async () => {
    try {
      if (!gpuEnabled) {
        await tf.setBackend('webgl');
        const gpuAvailable = tf.getBackend() === 'webgl';
        
        if (gpuAvailable) {
          setGpuEnabled(true);
          toast({
            title: "GPU Ativada",
            description: "Processamento GPU ativado com sucesso!",
          });
        } else {
          toast({
            title: "GPU Indisponível",
            description: "Não foi possível ativar o processamento GPU.",
            variant: "destructive",
          });
        }
      } else {
        await tf.setBackend('cpu');
        setGpuEnabled(false);
        toast({
          title: "GPU Desativada",
          description: "Voltando para processamento CPU.",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao alternar modo de processamento.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Verifica se GPU está disponível ao iniciar
    const checkGPU = async () => {
      const backend = await tf.ready();
      setGpuEnabled(tf.getBackend() === 'webgl');
    };
    checkGPU();
  }, []);

  const handlePlayerCountChange = (value: number[]) => {
    const count = value[0];
    setPlayerCount(count);
    onPlayersChange(count);
    toast({
      title: "Número de Jogadores Atualizado",
      description: `${count} jogadores serão usados na próxima geração.`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Button onClick={onPlay} disabled={isPlaying}>
          <Play className="mr-2 h-4 w-4" /> Iniciar
        </Button>
        <Button onClick={onPause} disabled={!isPlaying}>
          <Pause className="mr-2 h-4 w-4" /> Pausar
        </Button>
        <Button onClick={onReset}>
          <RotateCcw className="mr-2 h-4 w-4" /> Reiniciar
        </Button>
        <Button onClick={onThemeToggle}>
          <Moon className="mr-2 h-4 w-4" /> Alternar Tema
        </Button>
        <Button 
          onClick={toggleGPU}
          variant={gpuEnabled ? "destructive" : "default"}
          className="relative group"
        >
          <Cpu className="mr-2 h-4 w-4" />
          <Zap className={`absolute left-2 h-4 w-4 transition-opacity ${gpuEnabled ? 'opacity-100' : 'opacity-0'}`} />
          {gpuEnabled ? 'GPU Ativada' : 'Ativar GPU'}
        </Button>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Número de Jogadores: {playerCount}
        </label>
        <Slider
          value={[playerCount]}
          min={10}
          max={200}
          step={10}
          onValueChange={handlePlayerCountChange}
        />
        <p className="text-sm text-muted-foreground">
          Para uma GPU RTX 3060 12GB, recomenda-se até 150 jogadores para melhor performance.
        </p>
      </div>
    </div>
  );
};

export default GameControls;