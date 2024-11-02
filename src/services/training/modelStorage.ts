import * as tf from '@tensorflow/tfjs';
import { supabase } from '@/integrations/supabase/client';
import { systemLogger } from '@/utils/logging/systemLogger';
import { TrainingMetadata, ModelData } from './types';
import type { Json } from '@/integrations/supabase/types';

export async function saveModelToSupabase(model: tf.LayersModel, metadata: TrainingMetadata): Promise<boolean> {
  try {
    // Primeiro, desativa todos os modelos ativos
    await supabase
      .from('trained_models')
      .update({ is_active: false })
      .eq('is_active', true);

    // Prepara os dados do novo modelo
    const modelData: ModelData = {
      model_data: model.toJSON() as Json,
      metadata: {
        timestamp: metadata.timestamp,
        accuracy: metadata.accuracy,
        loss: metadata.loss,
        epochs: metadata.epochs,
        gamesCount: metadata.gamesCount,
        weights: metadata.weights
      } as Json,
      is_active: true
    };

    // Insere o novo modelo
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
    // Primeiro verifica se existem modelos
    const { count, error: countError } = await supabase
      .from('trained_models')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;
    
    // Se não houver modelos, retorna null
    if (count === 0) {
      return { model: null, metadata: null };
    }

    const { data, error } = await supabase
      .from('trained_models')
      .select()
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      const modelData = data.model_data as tf.io.ModelJSON;
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

    // Se não encontrou modelo ativo, tenta carregar do IndexedDB
    const model = await tf.loadLayersModel('indexeddb://current-model');
    return { model, metadata: null };
  } catch (error) {
    systemLogger.log('system', 'Erro ao carregar modelo', { error });
    return { model: null, metadata: null };
  }
}