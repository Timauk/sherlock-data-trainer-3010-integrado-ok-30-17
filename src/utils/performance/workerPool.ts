export class WorkerPool {
  private workers: Worker[] = [];
  private taskQueue: Array<() => Promise<any>> = [];
  private activeWorkers = 0;
  private maxWorkers: number;

  constructor(maxWorkers = navigator.hardwareConcurrency || 4) {
    this.maxWorkers = maxWorkers;
  }

  async addTask<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.taskQueue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.activeWorkers >= this.maxWorkers || this.taskQueue.length === 0) {
      return;
    }

    const task = this.taskQueue.shift();
    if (!task) return;

    this.activeWorkers++;
    try {
      await task();
    } finally {
      this.activeWorkers--;
      this.processQueue();
    }
  }

  terminate() {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.taskQueue = [];
    this.activeWorkers = 0;
  }
}