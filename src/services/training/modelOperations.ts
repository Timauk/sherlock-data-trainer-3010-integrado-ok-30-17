import * as tf from '@tensorflow/tfjs';
import { supabase } from '@/integrations/supabase/client';
import { systemLogger } from '@/utils/logging/systemLogger';
import { TrainingMetadata } from './types';
import type { Json } from '@/integrations/supabase/types';

export async function saveModel(model: tf.LayersModel, metadata: TrainingMetadata) {
  try {
    const { data, error } = await supabase
      .from('trained_models')
      .insert({
        model_data: model.toJSON() as unknown as Json,
        metadata: {
          timestamp: metadata.timestamp,
          accuracy: metadata.accuracy,
          loss: metadata.loss,
          epochs: metadata.epochs,
          gamesCount: metadata.gamesCount,
          weights: metadata.weights
        } as unknown as Json,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    systemLogger.log('system', 'Modelo salvo com sucesso', { metadata });
    return true;
  } catch (error) {
    systemLogger.log('system', 'Erro ao salvar modelo', { error });
    return false;
  }
}

export async function loadLatestModel(): Promise<{ model: tf.LayersModel | null; metadata: TrainingMetadata | null }> {
  try {
    const { data, error } = await supabase
      .from('trained_models')
      .select()
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;

    if (data) {
      const modelData = data.model_data as unknown as tf.io.ModelJSON;
      const model = await tf.models.modelFromJSON(modelData);
      
      const metadata = {
        timestamp: (data.metadata as any).timestamp || '',
        accuracy: (data.metadata as any).accuracy || 0,
        loss: (data.metadata as any).loss || 0,
        epochs: (data.metadata as any).epochs || 0,
        gamesCount: (data.metadata as any).gamesCount,
        weights: (data.metadata as any).weights
      } as TrainingMetadata;

      return { model, metadata };
    }

    const model = await tf.loadLayersModel('indexeddb://current-model');
    return { model, metadata: null };
  } catch (error) {
    systemLogger.log('system', 'Erro ao carregar modelo', { error });
    return { model: null, metadata: null };
  }
}