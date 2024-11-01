// Arquivo temporário para manter compatibilidade
// TODO: Remover quando a integração com Supabase for implementada
export const supabase = {
  from: () => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null })
  }),
  channel: () => ({
    on: () => ({ subscribe: () => {} })
  })
};