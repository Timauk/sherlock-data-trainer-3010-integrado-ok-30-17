import fs from 'fs/promises';
import { compressHistoricalData } from './dataCompression';

const CHUNK_SIZE = 64 * 1024; // 64KB chunks

export const optimizedCheckpointWrite = async (
  filepath: string, 
  data: any
): Promise<void> => {
  const compressedData = compressHistoricalData(data);
  const handle = await fs.open(filepath, 'w');
  
  try {
    for (let i = 0; i < compressedData.length; i += CHUNK_SIZE) {
      const chunk = compressedData.slice(i, i + CHUNK_SIZE);
      await handle.write(chunk);
    }
  } finally {
    await handle.close();
  }
};

export const optimizedCheckpointRead = async (
  filepath: string
): Promise<any> => {
  const handle = await fs.open(filepath, 'r');
  const chunks: Buffer[] = [];
  
  try {
    const stats = await handle.stat();
    let bytesRead = 0;
    
    while (bytesRead < stats.size) {
      const chunk = Buffer.alloc(CHUNK_SIZE);
      const result = await handle.read(chunk, 0, CHUNK_SIZE, bytesRead);
      chunks.push(chunk.slice(0, result.bytesRead));
      bytesRead += result.bytesRead;
    }
  } finally {
    await handle.close();
  }
  
  return Buffer.concat(chunks);
};