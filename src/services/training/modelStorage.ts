import * as tf from '@tensorflow/tfjs';
import { supabase } from '@/integrations/supabase/client';
import { systemLogger } from '@/utils/logging/systemLogger';
import { TrainingMetadata, ModelData } from './types';

export async function saveModelToSupabase(model: tf.LayersModel, metadata: TrainingMetadata): Promise<boolean> {
  try {
    // First, deactivate all existing models
    await supabase
      .from('trained_models')
      .update({ is_active: false })
      .eq('is_active', true);

    const modelData: ModelData = {
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
    };

    const { error } = await supabase
      .from('trained_models')
      .insert(modelData);

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
    // First check if there are any models at all
    const { count, error: countError } = await supabase
      .from('trained_models')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    // If no models exist, return null immediately
    if (count === 0) {
      systemLogger.log('system', 'Nenhum modelo encontrado no banco de dados');
      return { model: null, metadata: null };
    }

    // If models exist, try to get the active one
    const { data, error } = await supabase
      .from('trained_models')
      .select()
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

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

    // If no active model found, try to load from IndexedDB
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