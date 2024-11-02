import React from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, RefreshCw } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const API_URL = 'https://loteriascaixa-api.herokuapp.com/api/lotofacil/latest';

interface LotofacilResponse {
  concurso: number;
  data: string;
  dezenas: string[];
  acumulou: boolean;
  premiacoes: Array<{
    descricao: string;
    faixa: number;
    ganhadores: number;
    valorPremio: number;
  }>;
}

const DataUpdateButton = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { mutate: updateData, isPending } = useMutation({
    mutationFn: async (): Promise<LotofacilResponse> => {
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Falha ao atualizar dados');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Dados Atualizados",
        description: `Concurso #${data.concurso} - ${new Date(data.data).toLocaleDateString('pt-BR')}`,
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