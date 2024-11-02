// Temporary local storage implementation to replace Supabase
export const supabase = {
  from: (table: string) => ({
    select: async () => {
      const data = localStorage.getItem(table);
      return { data: data ? JSON.parse(data) : null, error: null };
    },
    insert: async (data: any) => {
      const existing = localStorage.getItem(table);
      const items = existing ? JSON.parse(existing) : [];
      items.push(data);
      localStorage.setItem(table, JSON.stringify(items));
      return { data, error: null };
    },
    update: async (data: any) => {
      localStorage.setItem(table, JSON.stringify(data));
      return { data, error: null };
    }
  })
};