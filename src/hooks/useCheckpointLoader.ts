import { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";

export const useCheckpointLoader = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadCheckpoint = async () => {
    setIsLoading(true);
    try {
      const savedCheckpoint = localStorage.getItem('gameCheckpoint');
      if (!savedCheckpoint) {
        return null;
      }
      return JSON.parse(savedCheckpoint);
    } catch (error) {
      toast({
        title: "Erro ao Carregar Checkpoint",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    loadCheckpoint,
    isLoading
  };
};