import React from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import DataUpdateButton from '../DataUpdateButton';

interface TrainingControlsProps {
  isTraining: boolean;
  onStartTraining: () => void;
}

const TrainingControls: React.FC<TrainingControlsProps> = ({
  isTraining,
  onStartTraining
}) => {
  const { toast } = useToast();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button 
          onClick={onStartTraining} 
          disabled={isTraining}
          className="w-full md:w-auto"
        >
          {isTraining ? 'Treinando...' : 'Iniciar Treinamento'}
        </Button>
        <DataUpdateButton />
      </div>
    </div>
  );
};

export default TrainingControls;