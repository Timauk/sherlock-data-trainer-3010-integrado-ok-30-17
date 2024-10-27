import { useToast } from "@/hooks/use-toast"

export const createSelectDirectory = (toast: ReturnType<typeof useToast>['toast']) => async (): Promise<string | null> => {
  // Define um diretório fixo chamado "Checkpoints"
  const checkpointsDir = "/Checkpoints";
  
  toast({
    title: "Diretório Configurado",
    description: `Os checkpoints serão salvos em: ${checkpointsDir}`,
  });

  return checkpointsDir;
};