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
      await model.save('indexeddb://current-model');
      
      const modelJSON = model.toJSON();
      
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
      const { data, error } = await supabase
        .from('trained_models')
        .select()
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      if (data) {
        const model = await tf.models.modelFromJSON(data.model_data);
        return { model, metadata: data.metadata };
      }

      // Try loading from IndexedDB if not found in Supabase
      const model = await tf.loadLayersModel('indexeddb://current-model');
      return { model, metadata: null };
    } catch (error) {
      systemLogger.log('system', 'Erro ao carregar modelo', { error });
      return { model: null, metadata: null };
    }
  },

  async getTrainingHistory() {
    try {
      const { data, error } = await supabase
        .from('trained_models')
        .select('metadata, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      systemLogger.log('system', 'Erro ao buscar histórico de treinamento', { error });
      return [];
    }
  }
};