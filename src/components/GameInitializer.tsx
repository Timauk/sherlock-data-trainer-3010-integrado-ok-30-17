import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GameInitializerProps {
  onSelectDirectory: () => Promise<void>;
  onStart: () => void;
}

const GameInitializer: React.FC<GameInitializerProps> = ({ onSelectDirectory, onStart }) => {
  const handleStart = async () => {
    await onSelectDirectory();
    onStart();
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Iniciar Jogo</CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleStart}
          className="w-full"
          size="lg"
        >
          Selecionar Pasta e Iniciar
        </Button>
      </CardContent>
    </Card>
  );
};

export default GameInitializer;