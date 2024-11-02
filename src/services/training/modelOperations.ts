import * as tf from '@tensorflow/tfjs';
import { supabase } from '@/integrations/supabase/client';
import { systemLogger } from '@/utils/logging/systemLogger';
import { TrainingMetadata } from './types';
import type { Json } from '@/lib/database.types';

export async function saveModelOperation(model: tf.LayersModel, metadata: TrainingMetadata): Promise<boolean> {
  try {
    await supabase
      .from('trained_models')
      .update({ is_active: false })
      .eq('is_active', true);

    const modelJson = model.toJSON();
    const weights = await model.getWeights();
    const weightsData = weights.map(w => Array.from(w.dataSync()));

    const metadataJson: Json = {
      timestamp: metadata.timestamp,
      accuracy: metadata.accuracy,
      loss: metadata.loss,
      epochs: metadata.epochs,
      weightsData // Using weightsData instead of weights
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

export async function loadLatestModelOperation(): Promise<{ model: tf.LayersModel | null; metadata: TrainingMetadata | null }> {
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
      const modelJson = data.model_data as unknown as tf.io.ModelJSON;
      const metadata = data.metadata as unknown as TrainingMetadata;
      
      const model = await tf.models.modelFromJSON(modelJson);
      
      if (metadata.weightsData) {
        const tensors = metadata.weightsData.map(w => tf.tensor(w));
        model.setWeights(tensors);
      }

      systemLogger.log('system', 'Modelo carregado com sucesso do Supabase');
      return { model, metadata };
    }

    return { model: null, metadata: null };
  } catch (error) {
    systemLogger.log('system', 'Erro ao carregar modelo do Supabase', { error });
    return { model: null, metadata: null };
  }
}