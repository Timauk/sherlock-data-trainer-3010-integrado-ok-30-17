import React from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, RefreshCw } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import { trainingService } from '@/services/trainingService';
import { lotofacilService } from '@/services/lotofacilService';

const TrainingUpdateButton = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { mutate: updateTrainingData, isPending } = useMutation({
    mutationFn: async () => {
      // 1. Verificar último resultado no banco
      const lastStoredGame = await trainingService.getLastStoredGame();
      
      // 2. Buscar último resultado da API
      const latestResult = await lotofacilService.fetchLatestFromAPI();
      
      // Se não precisar atualizar, retorna early
      if (lastStoredGame && lastStoredGame.concurso >= latestResult.concurso) {
        return { 
          updated: false, 
          message: 'Dados já estão atualizados!' 
        };
      }

      // 3. Buscar novos jogos
      const newGames = await lotofacilService.getLastResults();
      
      // 4. Salvar no banco e treinar
      await trainingService.updateGamesAndTrain(newGames);

      // 5. Exportar modelo treinado
      const modelExport = await trainingService.exportCurrentModel();
      
      // 6. Salvar arquivos no banco
      await trainingService.saveModelFiles(modelExport.json, modelExport.weights);

      return { 
        updated: true,
        message: `Dados atualizados até concurso ${latestResult.concurso}!`
      };
    },
    onSuccess: (result) => {
      if (result.updated) {
        // Dispara confetti se houve atualização
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
      
      queryClient.invalidateQueries({ queryKey: ['trainingHistory'] });
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
      onClick={() => updateTrainingData()}
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

export default TrainingUpdateButton;