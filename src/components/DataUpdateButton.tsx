import React from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, RefreshCw } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const DataUpdateButton = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { mutate: updateData, isPending } = useMutation({
    mutationFn: async () => {
      const response = await fetch('http://localhost:3001/api/lotofacil/update', {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error('Falha ao atualizar dados');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Dados Atualizados",
        description: `Último concurso: ${data.lastConcurso}`,
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