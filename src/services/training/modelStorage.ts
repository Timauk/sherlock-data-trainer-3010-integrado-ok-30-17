import * as tf from '@tensorflow/tfjs';
import { supabase } from '@/integrations/supabase/client';
import { systemLogger } from '@/utils/logging/systemLogger';
import { TrainingMetadata } from './types';
import type { Json } from '@/lib/database.types';

export async function saveModelToSupabase(model: tf.LayersModel, metadata: TrainingMetadata): Promise<boolean> {
  try {
    await supabase
      .from('trained_models')
      .update({ is_active: false })
      .eq('is_active', true);

    const modelJson = model.toJSON();
    const metadataJson: Json = {
      timestamp: metadata.timestamp,
      accuracy: metadata.accuracy,
      loss: metadata.loss,
      epochs: metadata.epochs,
      gamesCount: metadata.gamesCount,
      weights: metadata.weights
    };

    const { error } = await supabase
      .from('trained_models')
      .insert({
        model_data: modelJson as Json,
        metadata: metadataJson,
        is_active: true
      });

    if (error) throw error;
    
    systemLogger.log('system', 'Modelo salvo com sucesso no Supabase');
    return true;
  } catch (error) {
    systemLogger.log('system', 'Erro ao salvar modelo no Supabase', { error });
    return false;
  }
}

export async function loadLatestModelFromSupabase(): Promise<{ model: tf.LayersModel; metadata: TrainingMetadata | null; } | null> {
  try {
    const { data, error } = await supabase
      .from('trained_models')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (data && data.length > 0) {
      const modelData = data[0];
      const model = await tf.models.modelFromJSON(modelData.model_data as tf.io.ModelJSON);
      const metadata = modelData.metadata as TrainingMetadata;
      
      systemLogger.log('system', 'Modelo carregado com sucesso do Supabase');
      return { model, metadata };
    }

    try {
      const model = await tf.loadLayersModel('indexeddb://current-model');
      return { model, metadata: null };
    } catch (error) {
      systemLogger.log('system', 'Erro ao carregar modelo do IndexedDB', { error });
      return null;
    }
  } catch (error) {
    systemLogger.log('system', 'Erro ao carregar modelo do Supabase', { error });
    return null;
  }
}