import * as tf from '@tensorflow/tfjs';
import { supabase } from '@/integrations/supabase/client';
import { systemLogger } from '@/utils/logging/systemLogger';
import { TrainingMetadata } from './types';

export async function saveModelToSupabase(model: tf.LayersModel, metadata: TrainingMetadata): Promise<boolean> {
  try {
    await supabase
      .from('trained_models')
      .update({ is_active: false })
      .eq('is_active', true);

    const { error } = await supabase
      .from('trained_models')
      .insert({
        model_data: model.toJSON(),
        metadata: metadata,
        is_active: true
      });

    if (error) throw error;
    
    systemLogger.log('system', 'Modelo salvo com sucesso', { metadata });
    return true;
  } catch (error) {
    systemLogger.log('system', 'Erro ao salvar modelo', { error });
    return false;
  }
}

export async function loadModelFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('trained_models')
      .select()
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (data && data.length > 0) {
      const modelData = data[0].model_data as unknown as tf.io.ModelJSON;
      
      if (!modelData.modelTopology || !modelData.weightsManifest) {
        throw new Error('Dados do modelo inválidos');
      }

      const model = await tf.models.modelFromJSON(modelData);
      
      const metadata = {
        timestamp: (data[0].metadata as any).timestamp || '',
        accuracy: (data[0].metadata as any).accuracy || 0,
        loss: (data[0].metadata as any).loss || 0,
        epochs: (data[0].metadata as any).epochs || 0,
        gamesCount: (data[0].metadata as any).gamesCount,
        weights: (data[0].metadata as any).weights
      } as TrainingMetadata;

      return { model, metadata };
    }

    try {
      const model = await tf.loadLayersModel('indexeddb://current-model');
      return { model, metadata: null };
    } catch {
      return { model: null, metadata: null };
    }
  } catch (error) {
    systemLogger.log('system', 'Erro ao carregar modelo', { error });
    return { model: null, metadata: null };
  }
}