import { isBlockType } from "../../blocks/types.js";
import type { BlockType } from "../../blocks/types.js";

export interface DragPayload {
  readonly blockType: BlockType;
  readonly sourceId?: string;
}

const MIME = "application/json";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function setDragPayload(event: DragEvent, payload: DragPayload): void {
  const dt = event.dataTransfer;
  if (dt === null) return;
  dt.setData(MIME, JSON.stringify(payload));
  // Debe ser compatible con el dropEffect ("move") fijado en dragover;
  // si no, el navegador rechaza el drop y el evento drop nunca se dispara.
  dt.effectAllowed = payload.sourceId === undefined ? "copyMove" : "move";
}

export function getDragPayload(event: DragEvent): DragPayload | undefined {
  const raw = event.dataTransfer?.getData(MIME);
  if (raw === undefined || raw === "") return undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return undefined;
    const { blockType, sourceId } = parsed;
    if (typeof blockType !== "string" || !isBlockType(blockType)) return undefined;
    if (sourceId !== undefined && typeof sourceId !== "string") return undefined;
    return sourceId === undefined ? { blockType } : { blockType, sourceId };
  } catch {
    return undefined;
  }
}

/** Calcula el índice de inserción según la posición vertical del puntero. */
export function insertionIndexFor(
  container: HTMLElement,
  clientY: number,
): number {
  const items = Array.from(container.querySelectorAll<HTMLElement>("[data-block-id]"));
  for (let i = 0; i < items.length; i += 1) {
    const rect = items[i]?.getBoundingClientRect();
    if (rect === undefined) continue;
    if (clientY < rect.top + rect.height / 2) return i;
  }
  return items.length;
}
