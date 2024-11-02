import React from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import DataUpdateButton from '../DataUpdateButton';
import { Upload } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

interface TrainingControlsProps {
  isTraining: boolean;
  onStartTraining: () => void;
}

const TrainingControls: React.FC<TrainingControlsProps> = ({
  isTraining,
  onStartTraining
}) => {
  const { toast } = useToast();

  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.trim().split('\n');
      const header = lines[0];
      
      if (!header.startsWith('Concurso,Data Sorteio,Bola1')) {
        throw new Error('Formato de CSV inválido');
      }

      const games = lines.slice(1).map(line => {
        const [concurso, data, ...bolas] = line.split(',');
        return {
          concurso: parseInt(concurso),
          data: data.split('/').reverse().join('-'), // Converte DD/MM/YYYY para YYYY-MM-DD
          numeros: bolas.map(Number).slice(0, 15)
        };
      });

      const { error } = await supabase
        .from('historical_games')
        .upsert(games, { onConflict: 'concurso' });

      if (error) throw error;

      toast({
        title: "Dados Carregados",
        description: `${games.length} jogos foram importados com sucesso!`,
      });
    } catch (error) {
      toast({
        title: "Erro ao Carregar Dados",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }

    // Reset input
    event.target.value = '';
  };

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
        <div className="relative w-full md:w-auto">
          <input
            type="file"
            accept=".csv"
            onChange={handleCsvUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Button className="w-full md:w-auto">
            <Upload className="mr-2 h-4 w-4" />
            Carregar CSV Inicial
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TrainingControls;