import { useToast } from "@/hooks/use-toast"

export const createSelectDirectory = (toast: ReturnType<typeof useToast>['toast']) => async (): Promise<string | null> => {
  try {
    // Check if the File System Access API is supported
    if (!('showDirectoryPicker' in window)) {
      toast({
        title: "Erro de Compatibilidade",
        description: "Seu navegador não suporta seleção de diretório. Use Chrome ou Edge.",
        variant: "destructive"
      });
      return null;
    }

    // @ts-ignore - TypeScript doesn't yet have types for showDirectoryPicker
    const dirHandle = await window.showDirectoryPicker({
      mode: 'readwrite'
    });
    
    // Verify we have permission to write to this directory
    const permissionResult = await dirHandle.requestPermission({ mode: 'readwrite' });
    
    if (permissionResult !== 'granted') {
      toast({
        title: "Permissão Negada",
        description: "Você precisa dar permissão para salvar arquivos neste diretório.",
        variant: "destructive"
      });
      return null;
    }

    return dirHandle.name;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        // User cancelled the selection
        return null;
      }
      toast({
        title: "Erro ao Selecionar Diretório",
        description: error.message,
        variant: "destructive"
      });
    }
    return null;
  }
};