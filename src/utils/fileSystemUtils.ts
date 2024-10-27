import * as fs from 'fs';
import * as path from 'path';
import { useToast } from "@/hooks/use-toast";

const ensureCheckpointsDir = () => {
  const checkpointsDir = path.join(process.cwd(), 'Checkpoints');
  if (!fs.existsSync(checkpointsDir)) {
    fs.mkdirSync(checkpointsDir, { recursive: true });
  }
  return checkpointsDir;
};

export const saveCheckpoint = async (data: any) => {
  const checkpointsDir = ensureCheckpointsDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(checkpointsDir, `checkpoint-${timestamp}.json`);
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  return filePath;
};

export const loadLastCheckpoint = () => {
  const checkpointsDir = ensureCheckpointsDir();
  const files = fs.readdirSync(checkpointsDir);
  
  if (files.length === 0) return null;
  
  const lastFile = files
    .filter(f => f.endsWith('.json'))
    .sort()
    .reverse()[0];
    
  if (!lastFile) return null;
  
  const filePath = path.join(checkpointsDir, lastFile);
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
};

export const createSelectDirectory = (toast: ReturnType<typeof useToast>['toast']) => async (): Promise<string> => {
  const checkpointsDir = ensureCheckpointsDir();
  
  toast({
    title: "Diretório Configurado",
    description: `Os checkpoints serão salvos em: ${checkpointsDir}`,
  });

  return checkpointsDir;
};