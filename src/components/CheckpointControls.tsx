import React from 'react';
import { Button } from "@/components/ui/button";
import { Save, RotateCcw } from 'lucide-react';
import { saveCheckpoint, loadLastCheckpoint } from '@/utils/fileSystemUtils';
import { useToast } from "@/hooks/use-toast";

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

  const handleSaveCheckpoint = async () => {
    try {
      const gameState = {
        timestamp: new Date().toISOString(),
        // Adicione aqui os dados do jogo que você quer salvar
        path: savePath,
        // outros dados...
      };

      const savedPath = await saveCheckpoint(gameState);
      
      toast({
        title: "Checkpoint Salvo",
        description: `Arquivo salvo em: ${savedPath}`,
      });

    } catch (error) {
      toast({
        title: "Erro ao Salvar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  const handleLoadCheckpoint = () => {
    const checkpoint = loadLastCheckpoint();
    if (checkpoint) {
      toast({
        title: "Carregando Checkpoint",
        description: "Restaurando último estado salvo...",
      });
      // Implemente aqui a lógica para restaurar o estado do jogo
      window.location.reload();
    } else {
      toast({
        title: "Nenhum Checkpoint",
        description: "Não há checkpoint salvo para carregar.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-2 bg-secondary rounded-md">
        <p className="text-sm">Diretório de salvamento: {savePath}</p>
      </div>

      <Button 
        onClick={handleSaveCheckpoint}
        className="w-full"
      >
        <Save className="mr-2 h-4 w-4" /> Salvar Checkpoint Manual
      </Button>

      <Button 
        onClick={handleLoadCheckpoint}
        className="w-full"
      >
        <RotateCcw className="mr-2 h-4 w-4" /> Carregar Último Checkpoint
      </Button>
    </div>
  );
};

export default CheckpointControls;