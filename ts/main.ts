import "./blocks/index.js";
import { createBlockData, createId } from "./blocks/index.js";
import type { BlockType } from "./blocks/types.js";
import { initPalette } from "./components/Palette/Palette.js";
import { initCanvas } from "./components/Canvas/Canvas.js";
import { initPreview } from "./components/Preview/Preview.js";
import { EditorStore } from "./core/store/store.js";

function requireEl<T extends HTMLElement>(id: string, ctor: new () => T): T {
  const node = document.getElementById(id);
  if (node instanceof ctor) return node;
  throw new Error(`Elemento #${id} no encontrado`);
}

const paletteList = requireEl("palette-list", HTMLElement);
const canvasRoot = requireEl("canvas", HTMLElement);
const canvasList = requireEl("canvas-list", HTMLElement);
const canvasHint = requireEl("canvas-hint", HTMLElement);
const previewFrame = requireEl("preview-frame", HTMLElement);
const live = requireEl("sr-live", HTMLElement);
const downloadBtn = document.querySelector<HTMLButtonElement>(
  '[data-action="download-template"]',
);
if (downloadBtn === null) throw new Error("Botón de descarga no encontrado");

const store = new EditorStore();

function addBlockToEnd(type: BlockType): void {
  store.insertAt(store.blocks.length, createBlockData(type, createId()));
  live.textContent = "Bloque añadido al lienzo.";
}

initPalette(paletteList, addBlockToEnd);
initCanvas(canvasRoot, canvasList, canvasHint, live, store);
initPreview(previewFrame, downloadBtn, store);
