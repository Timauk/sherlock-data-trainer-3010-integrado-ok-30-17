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
    this.db = await openDB(this.config.name, this.config.version, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(this.config.storeName)) {
          db.createObjectStore(this.config.storeName, { keyPath: 'id' });
        }
      },
    });
  }

  async set(key: string, value: any) {
    if (!this.db) await this.initDB();
    
    const entry = {
      id: key,
      value,
      timestamp: Date.now(),
    };

    await this.db?.put(this.config.storeName, entry);
  }

  async get(key: string) {
    if (!this.db) await this.initDB();
    
    const entry = await this.db?.get(this.config.storeName, key);
    
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.config.expirationTime) {
      await this.delete(key);
      return null;
    }
    
    return entry.value;
  }

  async delete(key: string) {
    if (!this.db) await this.initDB();
    await this.db?.delete(this.config.storeName, key);
  }

  async clear() {
    if (!this.db) await this.initDB();
    await this.db?.clear(this.config.storeName);
  }

  async cleanup() {
    if (!this.db) await this.initDB();
    
    const all = await this.db?.getAll(this.config.storeName);
    const now = Date.now();
    
    for (const entry of all || []) {
      if (now - entry.timestamp > this.config.expirationTime) {
        await this.delete(entry.id);
      }
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