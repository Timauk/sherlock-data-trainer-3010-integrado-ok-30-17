import { supabase } from '@/lib/supabase';
import { systemLogger } from '@/utils/logging/systemLogger';
import { WorkerPool } from '@/utils/performance/workerPool';
import { BehaviorSubject } from 'rxjs';

interface QueuedOperation {
  id: string;
  type: 'insert' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
  retries?: number;
}

class HybridSyncService {
  private static instance: HybridSyncService;
  private operationQueue: QueuedOperation[] = [];
  private workerPool: WorkerPool;
  private syncStatus$ = new BehaviorSubject<'online' | 'offline'>('online');
  private localDb: IDBDatabase | null = null;

  private constructor() {
    this.workerPool = new WorkerPool();
    this.initIndexedDB();
    this.startBackgroundSync();
    this.setupNetworkListener();
  }

  static getInstance(): HybridSyncService {
    if (!HybridSyncService.instance) {
      HybridSyncService.instance = new HybridSyncService();
    }
    return HybridSyncService.instance;
  }

  private async initIndexedDB() {
    try {
      const request = indexedDB.open('hybridSync', 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('pendingOperations')) {
          db.createObjectStore('pendingOperations', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        this.localDb = (event.target as IDBOpenDBRequest).result;
      };
    } catch (error) {
      systemLogger.log('system', 'Error initializing IndexedDB', { error });
    }
  }

  private setupNetworkListener() {
    window.addEventListener('online', () => {
      this.syncStatus$.next('online');
      this.processPendingOperations();
    });
    
    window.addEventListener('offline', () => {
      this.syncStatus$.next('offline');
    });
  }

  private async startBackgroundSync() {
    setInterval(() => {
      if (this.syncStatus$.value === 'online') {
        this.processPendingOperations();
      }
    }, 5000);
  }

  async queueOperation(operation: Omit<QueuedOperation, 'id' | 'timestamp'>) {
    const queuedOp: QueuedOperation = {
      ...operation,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retries: 0
    };

    if (this.localDb) {
      const transaction = this.localDb.transaction(['pendingOperations'], 'readwrite');
      const store = transaction.objectStore('pendingOperations');
      await store.add(queuedOp);
    }

    this.operationQueue.push(queuedOp);
    
    if (this.syncStatus$.value === 'online') {
      this.processPendingOperations();
    }
  }

  private async processPendingOperations() {
    while (this.operationQueue.length > 0) {
      const operation = this.operationQueue[0];
      
      try {
        await this.workerPool.addTask(async () => {
          const { error } = await this.executeOperation(operation);
          
          if (!error) {
            this.operationQueue.shift();
            if (this.localDb) {
              const transaction = this.localDb.transaction(['pendingOperations'], 'readwrite');
              const store = transaction.objectStore('pendingOperations');
              await store.delete(operation.id);
            }
          } else if (operation.retries && operation.retries >= 3) {
            this.operationQueue.shift();
            systemLogger.log('system', 'Operation failed after max retries', { operation, error });
          } else {
            operation.retries = (operation.retries || 0) + 1;
          }
        });
      } catch (error) {
        systemLogger.log('system', 'Error processing operation', { operation, error });
      }
    }
  }

  private async executeOperation(operation: QueuedOperation) {
    const { type, table, data } = operation;
    const validTables = ['players', 'predictions', 'historical_games', 'webhooks', 'performance_metrics'] as const;
    
    if (!validTables.includes(table as typeof validTables[number])) {
      throw new Error(`Invalid table: ${table}`);
    }
    
    switch (type) {
      case 'insert':
        return await supabase.from(table as typeof validTables[number]).insert(data);
      case 'update':
        return await supabase.from(table as typeof validTables[number]).update(data.changes).eq('id', data.id);
      case 'delete':
        return await supabase.from(table as typeof validTables[number]).delete().eq('id', data.id);
      default:
        throw new Error(`Unknown operation type: ${type}`);
    }
  }

  async resolveConflict(serverData: any, localData: any) {
    // Default resolution strategy: server wins
    return serverData;
  }
}

export const hybridSyncService = HybridSyncService.getInstance();