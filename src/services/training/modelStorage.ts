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
      .select()
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(); // Using maybeSingle() instead of single()

    if (error) throw error;

    if (data) {
      // Validate model data structure
      const modelJson = data.model_data as any;
      if (!modelJson?.modelTopology || !modelJson?.weightsManifest) {
        throw new Error('Invalid model data structure');
      }

      const model = await tf.models.modelFromJSON(modelJson);
      const metadata = data.metadata as unknown as TrainingMetadata;
      
      systemLogger.log('system', 'Modelo carregado com sucesso do Supabase');
      return { model, metadata };
    }

    // If no active model in Supabase, try loading from IndexedDB
    try {
      const model = await tf.loadLayersModel('indexeddb://current-model');
      return { model, metadata: null };
    } catch (error) {
      systemLogger.log('system', 'Erro ao carregar modelo do IndexedDB', { error });
      // Create a new model if none exists
      const model = createInitialModel();
      return { model, metadata: null };
    }
  } catch (error) {
    systemLogger.log('system', 'Erro ao carregar modelo do Supabase', { error });
    return null;
  }
}

function createInitialModel(): tf.LayersModel {
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 128, activation: 'relu', inputShape: [17] }));
  model.add(tf.layers.dropout({ rate: 0.3 }));
  model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 15, activation: 'sigmoid' }));
  
  model.compile({
    optimizer: 'adam',
    loss: 'binaryCrossentropy',
    metrics: ['accuracy']
  });

  return model;
}