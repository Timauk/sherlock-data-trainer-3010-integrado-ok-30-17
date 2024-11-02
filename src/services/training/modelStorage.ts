import { supabase } from "@/integrations/supabase/client";
import { ModelData, TrainingMetadata } from "./types";
import * as tf from '@tensorflow/tfjs';
import { Json } from "@/integrations/supabase/types";
import { systemLogger } from '@/utils/logging/systemLogger';

export async function saveModelToSupabase(model: tf.LayersModel, metadata: TrainingMetadata): Promise<boolean> {
  try {
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
      .insert(modelData)
      .select();

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
      .limit(1)
      .maybeSingle(); // Using maybeSingle() to handle no results case

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

    // Fallback to local storage if no model in Supabase
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