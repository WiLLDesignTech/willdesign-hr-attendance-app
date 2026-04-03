const STORAGE_KEY = "wd-offline-queue";

export interface QueuedAction {
  readonly type: string;
  readonly employeeId: string;
  readonly timestamp: string;
}

interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class OfflineQueue {
  private actions: QueuedAction[];
  private readonly storage: StorageAdapter;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    const stored = storage.getItem(STORAGE_KEY);
    this.actions = stored ? (JSON.parse(stored) as QueuedAction[]) : [];
  }

  enqueue(action: QueuedAction): void {
    this.actions.push(action);
    this.persist();
  }

  dequeue(): QueuedAction | undefined {
    const action = this.actions.shift();
    this.persist();
    return action;
  }

  getAll(): readonly QueuedAction[] {
    return [...this.actions];
  }

  clear(): void {
    this.actions = [];
    this.storage.removeItem(STORAGE_KEY);
  }

  isEmpty(): boolean {
    return this.actions.length === 0;
  }

  private persist(): void {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(this.actions));
  }
}
