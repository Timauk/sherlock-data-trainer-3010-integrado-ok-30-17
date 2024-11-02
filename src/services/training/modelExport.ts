import { supabase } from '@/integrations/supabase/client';
import { systemLogger } from '@/utils/logging/systemLogger';
import { loadLatestModel } from './modelOperations';

export async function exportCurrentModel() {
  const result = await loadLatestModel();
  if (!result?.model) throw new Error('Nenhum modelo encontrado');

  const modelJSON = result.model.toJSON();
  const weights = await result.model.getWeights();
  
  return {
    json: modelJSON,
    weights: weights.map(w => w.arraySync())
  };
}

export async function saveModelFiles(modelJSON: any, weights: any) {
  try {
    const { error } = await supabase
      .from('trained_models')
      .update({
        model_data: modelJSON,
        metadata: { weights }
      })
      .eq('is_active', true);

    if (error) throw error;
    return true;
  } catch (error) {
    systemLogger.log('system', 'Erro ao salvar arquivos do modelo', { error });
    throw error;
  }
}