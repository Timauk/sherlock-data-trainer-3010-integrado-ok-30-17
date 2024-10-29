import { openDB, IDBPDatabase } from 'idb';

interface CacheConfig {
  name: string;
  version: number;
  storeName: string;
  expirationTime: number;
}

class AdvancedCache {
  private db: IDBPDatabase | null = null;
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
    this.initDB();
  }

  private async initDB() {
    try {
      this.db = await openDB(this.config.name, this.config.version, {
        upgrade: (db) => {
          if (!db.objectStoreNames.contains(this.config.storeName)) {
            db.createObjectStore(this.config.storeName, { keyPath: 'id' });
          }
        },
      });
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
    }
  }

  async set(key: string, value: any) {
    if (!this.db) await this.initDB();
    
    try {
      const entry = {
        id: key,
        value,
        timestamp: Date.now(),
      };

      await this.db?.put(this.config.storeName, entry);
    } catch (error) {
      console.error('Failed to set cache entry:', error);
    }
  }

  async get(key: string) {
    if (!this.db) await this.initDB();
    
    try {
      const entry = await this.db?.get(this.config.storeName, key);
      
      if (!entry) return null;
      
      if (Date.now() - entry.timestamp > this.config.expirationTime) {
        await this.delete(key);
        return null;
      }
      
      return entry.value;
    } catch (error) {
      console.error('Failed to get cache entry:', error);
      return null;
    }
  }

  async delete(key: string) {
    if (!this.db) await this.initDB();
    try {
      await this.db?.delete(this.config.storeName, key);
    } catch (error) {
      console.error('Failed to delete cache entry:', error);
    }
  }

  async clear() {
    if (!this.db) await this.initDB();
    try {
      await this.db?.clear(this.config.storeName);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  async cleanup() {
    if (!this.db) await this.initDB();
    
    try {
      const all = await this.db?.getAll(this.config.storeName);
      const now = Date.now();
      
      for (const entry of all || []) {
        if (now - entry.timestamp > this.config.expirationTime) {
          await this.delete(entry.id);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup cache:', error);
    }
  }
}

export const modelCache = new AdvancedCache({
  name: 'modelCache',
  version: 1,
  storeName: 'models',
  expirationTime: 24 * 60 * 60 * 1000, // 24 hours
});

export const predictionCache = new AdvancedCache({
  name: 'predictionCache',
  version: 1,
  storeName: 'predictions',
  expirationTime: 60 * 60 * 1000, // 1 hour
});

export const analysisCache = new AdvancedCache({
  name: 'analysisCache',
  version: 1,
  storeName: 'analysis',
  expirationTime: 12 * 60 * 60 * 1000, // 12 hours
});