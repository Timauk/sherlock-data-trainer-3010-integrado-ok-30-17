import React from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import { supabase } from '@/integrations/supabase/client';
import { lotofacilService } from '@/services/lotofacilService';

const DataUpdateButton = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { mutate: updateData, isPending } = useMutation({
    mutationFn: async () => {
      // 1. Fetch latest result from Lotofacil API
      const latestResult = await lotofacilService.fetchLatestFromAPI();

      // 2. Check if we already have this result
      const { data: existingGame, error: queryError } = await supabase
        .from('historical_games')
        .select('concurso')
        .eq('concurso', latestResult.concurso)
        .maybeSingle();

      if (queryError) throw queryError;

      if (existingGame) {
        return {
          updated: false,
          message: 'Dados já estão atualizados!',
          concurso: latestResult.concurso
        };
      }

      // 3. Get all missing games
      const allResults = await lotofacilService.getLastResults();
      
      // 4. Insert new games into database
      const { error: insertError } = await supabase
        .from('historical_games')
        .insert(
          allResults.map(game => ({
            concurso: game.concurso,
            data: game.data.split('/').reverse().join('-'), // Convert DD/MM/YYYY to YYYY-MM-DD
            numeros: game.dezenas.map(Number)
          }))
        );

      if (insertError) throw insertError;

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