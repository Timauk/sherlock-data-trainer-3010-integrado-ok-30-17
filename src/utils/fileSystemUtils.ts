import { useToast } from "@/hooks/use-toast";

const CHECKPOINTS_KEY = 'game_checkpoints';

const getCheckpoints = (): any[] => {
  const stored = localStorage.getItem(CHECKPOINTS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveCheckpoint = async (data: any) => {
  const checkpoints = getCheckpoints();
  const timestamp = new Date().toISOString();
  const checkpoint = {
    id: timestamp,
    timestamp,
    data
  };
  
  checkpoints.push(checkpoint);
  localStorage.setItem(CHECKPOINTS_KEY, JSON.stringify(checkpoints));
  
  return `checkpoint-${timestamp}`;
};

export const loadLastCheckpoint = () => {
  const checkpoints = getCheckpoints();
  if (checkpoints.length === 0) return null;
  
  return checkpoints[checkpoints.length - 1].data;
};

export const createSelectDirectory = (toast: ReturnType<typeof useToast>['toast']) => async (): Promise<string> => {
  const virtualDir = '/Checkpoints';
  
  toast({
    title: "Armazenamento Configurado",
    description: `Os checkpoints serão salvos localmente no navegador`,
  });

  return virtualDir;
};