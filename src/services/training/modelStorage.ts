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
    // Desativa modelos anteriores
    await supabase
      .from('trained_models')
      .update({ is_active: false })
      .eq('is_active', true);

    const modelJson = model.toJSON();
    const weights = await model.getWeights();
    const weightsData = await Promise.all(
      weights.map(w => Array.from(w.dataSync())) // Convert to regular arrays
    );

    const metadataJson: Json = {
      timestamp: metadata.timestamp,
      accuracy: typeof metadata.accuracy === 'number' ? metadata.accuracy : 0,
      loss: typeof metadata.loss === 'number' ? metadata.loss : 0,
      epochs: metadata.epochs,
      gamesCount: metadata.gamesCount,
      weightsData: weightsData // Now it's a regular array
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
    const { data, error } = await supabase
      .from('trained_models')
      .select()
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;

    if (data) {
      const modelJson = data.model_data as unknown as ModelTopology;
      const metadata = data.metadata as unknown as TrainingMetadata;
      
      // Reconstrói o modelo do JSON
      const model = await tf.models.modelFromJSON(modelJson);
      
      // Se tiver pesos salvos, carrega eles
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