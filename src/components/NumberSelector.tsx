import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface NumberSelectorProps {
  onNumbersSelected: (numbers: number[]) => void;
}

const NumberSelector: React.FC<NumberSelectorProps> = ({ onNumbersSelected }) => {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const { toast } = useToast();

  const toggleNumber = (num: number) => {
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(prev => prev.filter(n => n !== num));
    } else if (selectedNumbers.length < 15) {
      setSelectedNumbers(prev => [...prev, num].sort((a, b) => a - b));
    } else {
      toast({
        title: "Limite Atingido",
        description: "Você já selecionou 15 números",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full mb-4">
      <CardHeader>
        <CardTitle>Selecione 15 Números para Comparação</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 25 }, (_, i) => i + 1).map(num => (
            <Button
              key={num}
              variant={selectedNumbers.includes(num) ? "default" : "outline"}
              onClick={() => toggleNumber(num)}
              className="w-full h-12 text-lg font-bold"
            >
              {num.toString().padStart(2, '0')}
            </Button>
          ))}
        </div>
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">
            Números selecionados: {selectedNumbers.length}/15
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default NumberSelector;