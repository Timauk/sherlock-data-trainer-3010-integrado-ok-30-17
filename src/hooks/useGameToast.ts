import { useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";

export const useGameToast = () => {
  const { toast } = useToast();

  return useCallback((title: string, description: string) => {
    toast({
      title,
      description,
    });
  }, [toast]);
};