import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const TrainingPage: React.FC = () => {
  const handleStartTraining = () => {
    // Logic to start training
  };

  return (
    <div className="p-6">
      <Card>
        <CardContent>
          <h2 className="text-lg font-semibold">Treinamento do Modelo</h2>
          <p className="mb-4">Inicie o treinamento do modelo com os dados disponíveis.</p>
          <Button onClick={handleStartTraining}>Iniciar Treinamento</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainingPage;
