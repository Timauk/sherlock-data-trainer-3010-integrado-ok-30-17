// Arquivo temporário para manter compatibilidade
// TODO: Remover quando a integração com Supabase for implementada
export const supabase = {
  from: (table: string) => ({
    select: (query?: string) => ({
      order: (column: string, { ascending }: { ascending: boolean }) => ({
        limit: (num: number) => ({
          single: () => Promise.resolve({ data: null, error: null }),
          eq: (column: string, value: any) => Promise.resolve({ data: null, error: null })
        }),
        eq: (column: string, value: any) => Promise.resolve({ data: null, error: null })
      }),
      eq: (column: string, value: any) => Promise.resolve({ data: null, error: null })
    }),
    insert: (data: any) => Promise.resolve({ data: null, error: null }),
    update: (data: any) => ({
      eq: (column: string, value: any) => Promise.resolve({ data: null, error: null })
    }),
    delete: () => ({
      eq: (column: string, value: any) => Promise.resolve({ data: null, error: null })
    }),
    upsert: (data: any) => Promise.resolve({ data: null, error: null })
  }),
  channel: (name: string) => ({
    on: (event: string, filter: any, callback: (payload: any) => void) => ({
      subscribe: () => ({
        unsubscribe: () => {}
      })
    })
  }),
  rpc: (name: string, params?: any) => Promise.resolve({ data: null, error: null })
};