import React from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, RefreshCw } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import { supabase } from '@/integrations/supabase/client';

interface LotofacilResponse {
  concurso: number;
  data: string;
  dezenas: string[];
}

const DataUpdateButton = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { mutate: updateData, isPending } = useMutation({
    mutationFn: async () => {
      // 1. Fetch latest result from Lotofacil API
      const response = await fetch('https://loteriascaixa-api.herokuapp.com/api/lotofacil/latest');
      if (!response.ok) {
        throw new Error('Falha ao buscar dados da Lotofacil');
      }
      const latestResult: LotofacilResponse = await response.json();

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

      // 3. Insert new result into database
      const { error: insertError } = await supabase
        .from('historical_games')
        .insert({
          concurso: latestResult.concurso,
          data: latestResult.data.split('/').reverse().join('-'), // Convert DD/MM/YYYY to YYYY-MM-DD
          numeros: latestResult.dezenas.map(Number)
        });

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