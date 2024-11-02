import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from 'lucide-react';
import { trainingService } from '@/services/trainingService';

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
      </div>
    </div>
  );
};

export default TrainingControls;