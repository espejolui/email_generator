import type { AnyBlockData } from "../../blocks/types.js";
import { DEFAULT_TEMPLATE_BG } from "../render/exportToEmailHtml.js";
import { sanitizeColor } from "../sanitize/sanitize.js";

export type StoreListener = (blocks: readonly AnyBlockData[], background: string) => void;

export class EditorStore {
  #blocks: AnyBlockData[] = [];
  #background = DEFAULT_TEMPLATE_BG;
  #listeners = new Set<StoreListener>();

  get blocks(): readonly AnyBlockData[] {
    return [...this.#blocks];
  }

  get background(): string {
    return this.#background;
  }

  subscribe(listener: StoreListener): () => void {
    this.#listeners.add(listener);
    listener(this.blocks, this.#background);
    return () => {
      this.#listeners.delete(listener);
    };
  }

  #emit(): void {
    const snapshot = this.blocks;
    for (const listener of this.#listeners) listener(snapshot, this.#background);
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

  setBackground(value: string): void {
    const next = sanitizeColor(value);
    const resolved = next === "" ? DEFAULT_TEMPLATE_BG : next;
    if (resolved === this.#background) return;
    this.#background = resolved;
    this.#emit();
  }
}
