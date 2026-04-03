import { describe, it, expect, vi, beforeEach } from "vitest";
import { OfflineQueue, type QueuedAction } from "./offline-queue";

describe("OfflineQueue", () => {
  let queue: OfflineQueue;
  let mockStorage: Map<string, string>;

  beforeEach(() => {
    mockStorage = new Map();
    const storage = {
      getItem: vi.fn((key: string) => mockStorage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => mockStorage.set(key, value)),
      removeItem: vi.fn((key: string) => mockStorage.delete(key)),
    };
    queue = new OfflineQueue(storage);
  });

  it("enqueues an attendance action", () => {
    const action: QueuedAction = {
      type: "CLOCK_IN",
      employeeId: "EMP#001",
      timestamp: "2026-04-03T09:00:00Z",
    };
    queue.enqueue(action);
    expect(queue.getAll()).toHaveLength(1);
    expect(queue.getAll()[0]).toMatchObject(action);
  });

  it("dequeues actions in FIFO order", () => {
    queue.enqueue({ type: "CLOCK_IN", employeeId: "EMP#001", timestamp: "2026-04-03T09:00:00Z" });
    queue.enqueue({ type: "CLOCK_OUT", employeeId: "EMP#001", timestamp: "2026-04-03T18:00:00Z" });
    expect(queue.getAll()).toHaveLength(2);

    queue.dequeue();
    const remaining = queue.getAll();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].type).toBe("CLOCK_OUT");
  });

  it("persists actions to storage", () => {
    queue.enqueue({ type: "CLOCK_IN", employeeId: "EMP#001", timestamp: "2026-04-03T09:00:00Z" });
    expect(mockStorage.has("wd-offline-queue")).toBe(true);

    const stored = JSON.parse(mockStorage.get("wd-offline-queue")!);
    expect(stored).toHaveLength(1);
  });

  it("restores actions from storage on creation", () => {
    const actions = [{ type: "CLOCK_IN", employeeId: "EMP#001", timestamp: "2026-04-03T09:00:00Z" }];
    mockStorage.set("wd-offline-queue", JSON.stringify(actions));

    const restored = new OfflineQueue({
      getItem: (key: string) => mockStorage.get(key) ?? null,
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
    expect(restored.getAll()).toHaveLength(1);
  });

  it("clears all queued actions", () => {
    queue.enqueue({ type: "CLOCK_IN", employeeId: "EMP#001", timestamp: "2026-04-03T09:00:00Z" });
    queue.clear();
    expect(queue.getAll()).toHaveLength(0);
  });

  it("reports isEmpty correctly", () => {
    expect(queue.isEmpty()).toBe(true);
    queue.enqueue({ type: "CLOCK_IN", employeeId: "EMP#001", timestamp: "2026-04-03T09:00:00Z" });
    expect(queue.isEmpty()).toBe(false);
  });
});
