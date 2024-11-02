import * as tf from '@tensorflow/tfjs';
import { supabase } from '@/integrations/supabase/client';
import { systemLogger } from '@/utils/logging/systemLogger';
import { TrainingMetadata } from './types';
import type { Json } from '@/lib/database.types';

interface ModelTopology {
  modelTopology: any;
  weightsManifest?: any[];
  format?: string;
  generatedBy?: string;
  convertedBy?: string;
}

export async function saveModelToSupabase(model: tf.LayersModel, metadata: TrainingMetadata): Promise<boolean> {
  try {
    // First, deactivate all existing active models
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

export async function loadLatestModelFromSupabase(): Promise<{ model: tf.LayersModel | null; metadata: TrainingMetadata | null }> {
  try {
    // First, get the total number of games
    const { count: gamesCount } = await supabase
      .from('historical_games')
      .select('*', { count: 'exact', head: true });

    // Then get the latest active model
    const { data, error } = await supabase
      .from('trained_models')
      .select()
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    // If we found an active model
    if (data && data.length > 0) {
      const modelData = data[0];
      const modelJson = modelData.model_data as unknown as ModelTopology;
      
      // Validate model data structure
      if (!modelJson?.modelTopology) {
        throw new Error('Invalid model data structure');
      }

      const model = await tf.models.modelFromJSON(modelJson);
      const metadata = {
        ...(modelData.metadata as unknown as TrainingMetadata),
        gamesCount: gamesCount || 0
      };
      
      systemLogger.log('system', 'Modelo carregado com sucesso do Supabase');
      return { model, metadata };
    }

    // If no active model in Supabase, create a new one
    const model = createInitialModel();
    const metadata: TrainingMetadata = {
      timestamp: new Date().toISOString(),
      accuracy: 0,
      loss: 0,
      epochs: 0,
      gamesCount: gamesCount || 0
    };

    await saveModelToSupabase(model, metadata);
    
    return { model, metadata };
  } catch (error) {
    systemLogger.log('system', 'Erro ao carregar modelo do Supabase', { error });
    return { model: null, metadata: null };
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