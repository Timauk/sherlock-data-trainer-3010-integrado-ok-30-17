import * as tf from '@tensorflow/tfjs';
import { supabase } from '@/lib/supabase';
import { systemLogger } from '@/utils/logging/systemLogger';

interface TrainingMetadata {
  timestamp: string;
  accuracy: number;
  loss: number;
  epochs: number;
}

export const trainingService = {
  async saveModel(model: tf.LayersModel, metadata: TrainingMetadata) {
    try {
      // Salvar o modelo no IndexedDB primeiro (backup local)
      await model.save('indexeddb://current-model');
      
      // Serializar o modelo para JSON
      const modelJSON = model.toJSON();
      
      // Salvar no Supabase
      const { error } = await supabase
        .from('trained_models')
        .insert({
          model_data: modelJSON,
          metadata,
          is_active: true
        });

      if (error) throw error;

      systemLogger.log('system', 'Modelo salvo com sucesso', { metadata });
      return true;
    } catch (error) {
      systemLogger.log('system', 'Erro ao salvar modelo', { error });
      return false;
    }
  },

  async loadLatestModel(): Promise<{ model: tf.LayersModel | null; metadata: TrainingMetadata | null }> {
    try {
      // Tentar carregar do Supabase primeiro
      const modelQuery = supabase
        .from('trained_models')
        .select()
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const { data: modelData, error } = await modelQuery;

      if (error) throw error;

      if (modelData) {
        const model = await tf.models.modelFromJSON(modelData.model_data);
        return { model, metadata: modelData.metadata };
      }

      // Se não encontrar no Supabase, tentar carregar do IndexedDB
      const model = await tf.loadLayersModel('indexeddb://current-model');
      return { model, metadata: null };
    } catch (error) {
      systemLogger.log('system', 'Erro ao carregar modelo', { error });
      return { model: null, metadata: null };
    }
  },

  async getTrainingHistory() {
    try {
      const historyQuery = supabase
        .from('trained_models')
        .select('metadata, created_at')
        .order('created_at', { ascending: false });

      const { data, error } = await historyQuery;

      if (error) throw error;
      return data || [];
    } catch (error) {
      systemLogger.log('system', 'Erro ao buscar histórico de treinamento', { error });
      return [];
    }
  }
};