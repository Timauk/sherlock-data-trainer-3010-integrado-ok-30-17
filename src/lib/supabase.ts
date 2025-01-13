// Implementação local do Supabase
class LocalSupabase {
  private storage: { [key: string]: any[] } = {};

  from(table: string) {
    if (!this.storage[table]) {
      this.storage[table] = [];
    }

    return {
      select: (columns: string = '*') => {
        return {
          data: this.storage[table],
          error: null,
          eq: (field: string, value: any) => {
            const filtered = this.storage[table].filter((item: any) => item[field] === value);
            return {
              data: filtered,
              error: null,
              single: () => ({
                data: filtered.length > 0 ? filtered[0] : null,
                error: null
              })
            };
          }
        };
      },
      insert: async (data: any) => {
        const newItem = {
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          ...data
        };
        this.storage[table].push(newItem);
        return { data: newItem, error: null };
      },
      update: async (data: any) => {
        return { data, error: null };
      },
      delete: async () => {
        this.storage[table] = [];
        return { data: null, error: null };
      }
    };
  }
}

export const supabase = new LocalSupabase();