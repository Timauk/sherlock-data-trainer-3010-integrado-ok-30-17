import { LayersModel } from '@tensorflow/tfjs';

declare global {
  type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
  };

  interface Window {
    tf: typeof import('@tensorflow/tfjs');
  }

  type Nullable<T> = T | null;
  
  type Optional<T> = T | undefined;
  
  interface BaseResponse {
    success: boolean;
    message?: string;
    error?: string;
  }

  interface ModelResponse extends BaseResponse {
    model?: LayersModel;
    metadata?: any;
  }
}

export {};