import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { gameService } from '@/services/gameService';

export const useSupabaseSync = () => {
  const { toast } = useToast();

  useEffect(() => {
    const subscription = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'historical_games' },
        (payload) => {
          toast({
            title: "Novo Resultado",
            description: `Concurso ${payload.new.concurso} adicionado`
          });
        }
      )
      .subscribe();

    // Sincroniza com a API oficial a cada 6 horas
    const syncInterval = setInterval(() => {
      gameService.syncWithOfficialAPI();
    }, 6 * 60 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(syncInterval);
    };
  }, [toast]);
};