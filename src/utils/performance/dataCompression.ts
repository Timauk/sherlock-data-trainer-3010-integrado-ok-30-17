import pako from 'pako';

export const compressHistoricalData = (data: number[][]): Uint8Array => {
  const jsonString = JSON.stringify(data);
  return pako.deflate(jsonString);
};

export const decompressHistoricalData = (compressedData: Uint8Array): number[][] => {
  const jsonString = pako.inflate(compressedData, { to: 'string' });
  return JSON.parse(jsonString);
};