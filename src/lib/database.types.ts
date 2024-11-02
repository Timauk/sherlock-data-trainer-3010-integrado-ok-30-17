// Split into multiple files for better organization
import { Json } from './types/json.types';
import { Tables } from './types/tables.types';
import { Views } from './types/views.types';
import { Functions } from './types/functions.types';
import { Enums } from './types/enums.types';

export type Database = {
  public: {
    Tables: Tables;
    Views: Views;
    Functions: Functions;
    Enums: Enums;
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type * from './types/json.types';
export type * from './types/tables.types';
export type * from './types/views.types';
export type * from './types/functions.types';
export type * from './types/enums.types';