import React from 'react';
import { Button } from "@/components/ui/button";
import { Save, RotateCcw } from 'lucide-react';
import { createSelectDirectory } from '@/utils/fileSystemUtils';
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
  const selectDirectory = React.useMemo(() => createSelectDirectory(toast), [toast]);

  const handleDirectorySelect = async () => {
    const selectedPath = await selectDirectory();
    if (selectedPath) {
      onSavePathChange(selectedPath);
      localStorage.setItem('checkpointPath', selectedPath);
    }
  };

  const handleLoadCheckpoint = () => {
    const lastCheckpoint = localStorage.getItem('gameCheckpoint');
    if (lastCheckpoint) {
      toast({
        title: "Carregando Checkpoint",
        description: "Restaurando último estado salvo...",
      });
      window.location.reload();
    }
  };

  return (
    <div className="space-y-4">
      <Button 
        onClick={handleDirectorySelect}
        className="w-full"
      >
        Configurar Diretório de Salvamento
      </Button>
      
      {savePath && (
        <div className="p-2 bg-secondary rounded-md">
          <p className="text-sm">Diretório atual: {savePath}</p>
        </div>
      )}

      <Button 
        onClick={onAutoSave}
        className="w-full"
        disabled={!savePath}
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