import { useToast } from "@/hooks/use-toast";

interface ToastProps {
  title: string;
  description: string;
  variant?: "default" | "destructive";
}

let saveDirectory: FileSystemDirectoryHandle | null = null;

const getSaveDirectory = async () => {
  if (!('showDirectoryPicker' in window)) {
    throw new Error('Seu navegador não suporta a seleção de diretórios.');
  }
  return saveDirectory;
};

export const saveCheckpoint = async (data: any) => {
  try {
    const directory = await getSaveDirectory();
    if (!directory) throw new Error('Nenhum diretório selecionado');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `checkpoint-${timestamp}.json`;
    
    const fileHandle = await directory.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
    
    return fileName;
  } catch (error) {
    console.error('Erro ao salvar checkpoint:', error);
    throw error;
  }
};

export const loadLastCheckpoint = async () => {
  try {
    const directory = await getSaveDirectory();
    if (!directory) return null;

    const files: FileSystemFileHandle[] = [];
    
    // Using values() instead of entries() for directory iteration
    const entries = await Promise.all(
      Array.from(await directory.values())
        .filter(async (handle) => (await handle).kind === 'file')
    );
    
    for (const handle of entries) {
      if (handle.name.endsWith('.json')) {
        files.push(handle);
      }
    }

    if (files.length === 0) return null;

    // Sort files by name (which contains timestamp)
    const lastFile = files
      .sort((a, b) => b.name.localeCompare(a.name))[0];
    
    const file = await lastFile.getFile();
    const content = await file.text();
    
    return JSON.parse(content);
  } catch (error) {
    console.error('Erro ao carregar checkpoint:', error);
    return null;
  }
};

type ToastFunction = {
  toast: (props: ToastProps) => void;
};

export const createSelectDirectory = (toastFns: ToastFunction) => async (): Promise<string> => {
  try {
    if (!('showDirectoryPicker' in window)) {
      throw new Error('Seu navegador não suporta a seleção de diretórios.');
    }

    saveDirectory = await window.showDirectoryPicker({
      mode: 'readwrite',
    });

    const dirName = saveDirectory.name;
    toastFns.toast({
      title: "Diretório Configurado",
      description: `Os checkpoints serão salvos em: ${dirName}`,
    });

    return dirName;
  } catch (error) {
    console.error('Erro ao selecionar diretório:', error);
    toastFns.toast({
      title: "Erro",
      description: error instanceof Error ? error.message : "Erro ao selecionar diretório",
      variant: "destructive"
    });
    throw error;
  }
};