import React from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';
import TrainingUpdateButton from '../TrainingUpdateButton';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TrainingControlsProps {
  isTraining: boolean;
  onStartTraining: () => void;
  config: {
    batchSize: number;
    epochs: number;
    learningRate: number;
    validationSplit: number;
  };
  onConfigChange: (key: string, value: number) => void;
}

const TrainingControls: React.FC<TrainingControlsProps> = ({
  isTraining,
  onStartTraining,
  config,
  onConfigChange
}) => {
  const { toast } = useToast();

  const handleStartTraining = async () => {
    try {
      onStartTraining();
      toast({
        title: "Treinamento Iniciado",
        description: "O modelo está sendo treinado com os dados disponíveis."
      });
    } catch (error) {
      toast({
        title: "Erro no Treinamento",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="batchSize">Batch Size</Label>
          <Input
            id="batchSize"
            type="number"
            value={config.batchSize}
            onChange={(e) => onConfigChange('batchSize', Number(e.target.value))}
            min={1}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="epochs">Épocas</Label>
          <Input
            id="epochs"
            type="number"
            value={config.epochs}
            onChange={(e) => onConfigChange('epochs', Number(e.target.value))}
            min={1}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="learningRate">Taxa de Aprendizado</Label>
          <Input
            id="learningRate"
            type="number"
            value={config.learningRate}
            onChange={(e) => onConfigChange('learningRate', Number(e.target.value))}
            step="0.001"
            min="0.0001"
            max="1"
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="validationSplit">Validação Split</Label>
          <Input
            id="validationSplit"
            type="number"
            value={config.validationSplit}
            onChange={(e) => onConfigChange('validationSplit', Number(e.target.value))}
            step="0.1"
            min="0"
            max="1"
            className="w-full"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button 
          onClick={handleStartTraining} 
          disabled={isTraining}
          className="w-full md:w-auto"
        >
          {isTraining ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Treinando...
            </>
          ) : (
            'Iniciar Treinamento'
          )}
        </Button>
        <TrainingUpdateButton />
      </div>
    </div>
  );
};

export default TrainingControls;