import type { AnyBlockData } from "../../blocks/types.js";

export type StoreListener = (blocks: readonly AnyBlockData[]) => void;

export class EditorStore {
  #blocks: AnyBlockData[] = [];
  #listeners = new Set<StoreListener>();

  get blocks(): readonly AnyBlockData[] {
    return [...this.#blocks];
  }

  subscribe(listener: StoreListener): () => void {
    this.#listeners.add(listener);
    listener(this.blocks);
    return () => {
      this.#listeners.delete(listener);
    };
  }

  #emit(): void {
    const snapshot = this.blocks;
    for (const listener of this.#listeners) listener(snapshot);
  }

  insertAt(index: number, block: AnyBlockData): void {
    const safe = Math.max(0, Math.min(index, this.#blocks.length));
    this.#blocks.splice(safe, 0, block);
    this.#emit();
  }

  move(sourceId: string, targetIndex: number): void {
    const from = this.#blocks.findIndex((b) => b.id === sourceId);
    if (from === -1) return;
    const [item] = this.#blocks.splice(from, 1);
    if (item === undefined) return;
    const safe = Math.max(0, Math.min(targetIndex, this.#blocks.length));
    this.#blocks.splice(safe, 0, item);
    this.#emit();
  }

  update(id: string, patch: Partial<AnyBlockData>): void {
    const current = this.#blocks.find((b) => b.id === id);
    if (current === undefined) return;
    const next = { ...current, ...patch, id: current.id, type: current.type } as AnyBlockData;
    this.#blocks = this.#blocks.map((b) => (b.id === id ? next : b));
    this.#emit();
  }

  remove(id: string): void {
    const before = this.#blocks.length;
    this.#blocks = this.#blocks.filter((b) => b.id !== id);
    if (this.#blocks.length !== before) this.#emit();
  }
}
