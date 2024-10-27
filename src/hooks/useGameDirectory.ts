import { useState, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";

export const useGameDirectory = () => {
  const [saveDirectory, setSaveDirectory] = useState<FileSystemDirectoryHandle | null>(null);
  const { toast } = useToast();

  const selectDirectory = useCallback(async () => {
    try {
      if (!('showDirectoryPicker' in window)) {
        toast({
          title: "Aviso",
          description: "Seu navegador não suporta seleção de pasta. Os dados serão salvos apenas localmente.",
          variant: "warning"
        });
        return null;
      }

      const handle = await (window as any).showDirectoryPicker();
      setSaveDirectory(handle);
      toast({
        title: "Pasta Selecionada",
        description: "Os dados do jogo serão salvos nesta pasta."
      });
      return handle;
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        toast({
          title: "Erro",
          description: "Não foi possível selecionar a pasta. Usando armazenamento local.",
          variant: "destructive"
        });
      }
      return null;
    }
  }, [toast]);

  return {
    saveDirectory,
    selectDirectory
  };
};