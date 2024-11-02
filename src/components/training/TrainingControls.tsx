import React from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';
import TrainingUpdateButton from '../TrainingUpdateButton';

interface TrainingControlsProps {
  isTraining: boolean;
  onStartTraining: () => void;
}

const TrainingControls: React.FC<TrainingControlsProps> = ({
  isTraining,
  onStartTraining
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
    <div className="space-y-4">
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