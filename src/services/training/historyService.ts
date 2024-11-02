import { supabase } from '@/integrations/supabase/client';
import { systemLogger } from '@/utils/logging/systemLogger';

export async function getTrainingHistory() {
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

export async function getLastStoredGame() {
  try {
    const { data, error } = await supabase
      .from('historical_games')
      .select('concurso, data')
      .order('concurso', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    systemLogger.log('system', 'Erro ao buscar último jogo', { error });
    return null;
  }
}

export async function getStoredGamesCount() {
  try {
    const { count, error } = await supabase
      .from('historical_games')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  } catch (error) {
    systemLogger.log('system', 'Erro ao buscar contagem de jogos', { error });
    return 0;
  }
}