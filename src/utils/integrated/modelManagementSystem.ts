import * as tf from '@tensorflow/tfjs';
import { supabase } from '@/lib/supabase';
import { ModelArtifacts, ModelArtifactsInfo, GameState } from '@/types/gameTypes';
import { systemLogger } from '../logging/systemLogger';
import fs from 'fs';
import path from 'path';

interface ModelMetadata {
  timestamp: string;
  architecture: string[];
  performance: {
    accuracy: number;
    loss: number;
  };
  trainingIterations: number;
}

export class ModelManager {
  private static instance: ModelManager;
  private readonly basePath: string;
  private currentModel: tf.LayersModel | null = null;
  private metadata: ModelMetadata | null = null;

  private constructor() {
    this.basePath = path.join(process.cwd(), 'models');
  }

  static getInstance(): ModelManager {
    if (!ModelManager.instance) {
      ModelManager.instance = new ModelManager();
    }
    return ModelManager.instance;
  }

  async saveModel(model: tf.LayersModel, metadata: ModelMetadata): Promise<void> {
    try {
      await this.saveModelLocally(model, metadata);
      await this.backupModelToSupabase(model, metadata);
      systemLogger.log('model', 'Modelo salvo com sucesso', { metadata });
    } catch (error) {
      systemLogger.log('model', 'Erro ao salvar modelo', { error });
      throw error;
    }
  }

  private async saveModelLocally(model: tf.LayersModel, metadata: ModelMetadata): Promise<void> {
    const modelPath = path.join(this.basePath, metadata.timestamp);
    await fs.promises.mkdir(this.basePath, { recursive: true });
    await model.save(`file://${modelPath}`);
    await fs.promises.writeFile(
      path.join(modelPath, 'metadata.json'),
      JSON.stringify(metadata)
    );
  }

  private async backupModelToSupabase(model: tf.LayersModel, metadata: ModelMetadata): Promise<void> {
    const modelData = await model.save('indexeddb://temp-backup');
    const { error } = await supabase.from('models').insert({
      data: modelData,
      metadata,
      created_at: new Date().toISOString()
    });
    
    if (error) throw error;
  }

  async loadModel(): Promise<{
    model: tf.LayersModel | null;
    metadata: ModelMetadata | null;
  }> {
    try {
      const result = await this.loadModelLocally();
      if (result.model) {
        this.currentModel = result.model;
        this.metadata = result.metadata;
        return result;
      }

      return await this.loadModelFromSupabase();
    } catch (error) {
      systemLogger.log('model', 'Erro ao carregar modelo', { error });
      return { model: null, metadata: null };
    }
  }

  private async loadModelLocally(): Promise<{
    model: tf.LayersModel | null;
    metadata: ModelMetadata | null;
  }> {
    try {
      const files = await fs.promises.readdir(this.basePath);
      const latestModel = files
        .filter(f => f.startsWith('model'))
        .sort()
        .pop();

      if (!latestModel) return { model: null, metadata: null };

      const modelPath = path.join(this.basePath, latestModel);
      const model = await tf.loadLayersModel(`file://${modelPath}`);
      const metadata = JSON.parse(
        await fs.promises.readFile(
          path.join(modelPath, 'metadata.json'),
          'utf-8'
        )
      );

      return { model, metadata };
    } catch (error) {
      systemLogger.log('model', 'Erro ao carregar modelo local', { error });
      return { model: null, metadata: null };
    }
  }

  private async loadModelFromSupabase(): Promise<{
    model: tf.LayersModel | null;
    metadata: ModelMetadata | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('models')
        .select('*')
        .eq('status', 'active')
        .single();

      if (error || !data) {
        systemLogger.log('model', 'Erro ao carregar modelo do Supabase', { error });
        return { model: null, metadata: null };
      }

      const model = await tf.loadLayersModel(
        tf.io.fromMemory(data.data)
      );
      
      return { model, metadata: data.metadata };
    } catch (error) {
      systemLogger.log('model', 'Erro ao carregar modelo do Supabase', { error });
      return { model: null, metadata: null };
    }
  }

  async saveGameState(state: GameState): Promise<void> {
    try {
      const stateWithTimestamp = {
        ...state,
        savedAt: new Date().toISOString()
      };

      await fs.promises.writeFile(
        path.join(this.basePath, 'gameState.json'),
        JSON.stringify(stateWithTimestamp)
      );

      systemLogger.log('model', 'Estado do jogo salvo com sucesso');
    } catch (error) {
      systemLogger.log('model', 'Erro ao salvar estado do jogo', { error });
      throw error;
    }
  }

  async loadGameState(): Promise<GameState | null> {
    try {
      const data = await fs.promises.readFile(
        path.join(this.basePath, 'gameState.json'),
        'utf-8'
      );
      return JSON.parse(data);
    } catch (error) {
      systemLogger.log('model', 'Erro ao carregar estado do jogo', { error });
      return null;
    }
  }

  getCurrentModel(): tf.LayersModel | null {
    return this.currentModel;
  }

  getMetadata(): ModelMetadata | null {
    return this.metadata;
  }
}

export const modelManager = ModelManager.getInstance();