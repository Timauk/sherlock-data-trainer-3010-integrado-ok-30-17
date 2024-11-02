import React from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import { lotofacilService } from '@/services/lotofacilService';

const DataUpdateButton = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { mutate: updateData, isPending } = useMutation({
    mutationFn: async () => {
      // 1. Fetch latest result from Lotofacil API
      const latestResult = await lotofacilService.fetchLatestFromAPI();
      
      // 2. Get stored games from localStorage
      const storedGames = JSON.parse(localStorage.getItem('historical_games') || '[]');
      
      // 3. Check if we already have this result
      const existingGame = storedGames.find(game => game.concurso === latestResult.concurso);

      if (existingGame) {
        return {
          updated: false,
          message: 'Dados já estão atualizados!',
          concurso: latestResult.concurso
        };
      }

      // 4. Get all missing games
      const allResults = await lotofacilService.getLastResults();
      
      // 5. Store new games in localStorage
      const newGames = allResults.map(game => ({
        concurso: game.concurso,
        data: game.data.split('/').reverse().join('-'), // Convert DD/MM/YYYY to YYYY-MM-DD
        numeros: game.dezenas.map(Number)
      }));

      localStorage.setItem('historical_games', JSON.stringify([...storedGames, ...newGames]));

      return {
        updated: true,
        message: `Dados atualizados até concurso ${latestResult.concurso}!`,
        concurso: latestResult.concurso
      };
    },
    onSuccess: (result) => {
      if (result.updated) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      
      toast({
        title: result.updated ? "Atualização Concluída!" : "Verificação Concluída",
        description: result.message,
      });
      
      queryClient.invalidateQueries({ queryKey: ['lotofacilData'] });
    },
    onError: (error) => {
      toast({
        title: "Erro na Atualização",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  return (
    <Button 
      onClick={() => updateData()}
      disabled={isPending}
      className="w-full md:w-auto"
    >
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="mr-2 h-4 w-4" />
      )}
      Atualizar Dados
    </Button>
  );
};

export default DataUpdateButton;