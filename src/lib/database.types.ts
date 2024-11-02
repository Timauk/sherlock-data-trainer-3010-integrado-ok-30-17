export interface Database {
  public: {
    Tables: {
      models: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          data: any;
          metrics: any;
        };
      };
      training_history: {
        Row: {
          id: string;
          created_at: string;
          model_id: string;
          metrics: any;
        };
      };
    };
  };
}