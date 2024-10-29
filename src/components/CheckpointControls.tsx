import React from 'react';
import { Button } from "@/components/ui/button";
import { Save, RotateCcw, FolderOpen } from 'lucide-react';
import { saveCheckpoint, loadLastCheckpoint, createSelectDirectory } from '@/utils/fileSystemUtils';
import { useToast } from "@/hooks/use-toast";
import { useGameState } from '@/hooks/useGameState';

interface CheckpointControlsProps {
  savePath: string;
  onSavePathChange: (path: string) => void;
  onAutoSave: () => void;
}

const CheckpointControls: React.FC<CheckpointControlsProps> = ({
  savePath,
  onSavePathChange,
  onAutoSave,
}) => {
  const { toast } = useToast();
  const gameState = useGameState();
  const selectDirectory = createSelectDirectory({ toast });

  const handleSelectDirectory = async () => {
    try {
      const dirName = await selectDirectory();
      onSavePathChange(dirName);
      localStorage.setItem('checkpointPath', dirName);
    } catch (error) {
      console.error('Erro ao selecionar diretório:', error);
    }
  };

  const handleSaveCheckpoint = async () => {
    if (!gameState) {
      toast({
        title: "Erro",
        description: "Estado do jogo não disponível",
        variant: "destructive"
      });
      return;
    }

    try {
      const checkpointData = {
        ...gameState,
        timestamp: new Date().toISOString(),
        path: savePath,
      };

      const savedFile = await saveCheckpoint(checkpointData);
      
      toast({
        title: "Checkpoint Salvo",
        description: `Arquivo salvo: ${savedFile}`,
      });

    } catch (error) {
      toast({
        title: "Erro ao Salvar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  const handleLoadCheckpoint = async () => {
    try {
      const checkpoint = await loadLastCheckpoint();
      if (checkpoint) {
        localStorage.setItem('gameCheckpoint', JSON.stringify(checkpoint));
        toast({
          title: "Carregando Checkpoint",
          description: "Restaurando último estado salvo...",
        });
        window.location.reload();
      } else {
        toast({
          title: "Nenhum Checkpoint",
          description: "Não há checkpoint salvo para carregar.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao Carregar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-2 bg-secondary rounded-md">
        <p className="text-sm">Diretório de salvamento: {savePath || "Nenhum diretório selecionado"}</p>
      </div>

      <Button 
        onClick={handleSelectDirectory}
        className="w-full"
      >
        <FolderOpen className="mr-2 h-4 w-4" /> Selecionar Diretório
      </Button>

      <Button 
        onClick={handleSaveCheckpoint}
        className="w-full"
        disabled={!savePath}
      >
        <Save className="mr-2 h-4 w-4" /> Salvar Checkpoint Manual
      </Button>

      <Button 
        onClick={handleLoadCheckpoint}
        className="w-full"
        disabled={!savePath}
      >
        <RotateCcw className="mr-2 h-4 w-4" /> Carregar Último Checkpoint
      </Button>
    </div>
  );
};

export default CheckpointControls;