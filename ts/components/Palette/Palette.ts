import { getRegisteredBlocks } from "../../blocks/index.js";
import { setDragPayload } from "../../core/dnd/dragController.js";
import type { BlockType } from "../../blocks/types.js";
import { isBlockType } from "../../blocks/types.js";

export function initPalette(listEl: HTMLElement): void {
  listEl.replaceChildren();
  for (const meta of getRegisteredBlocks()) {
    if (!isBlockType(meta.type)) continue;
    const type: BlockType = meta.type;
    const item = document.createElement("li");
    item.draggable = true;
    item.dataset["blockType"] = type;
    item.setAttribute("aria-grabbed", "false");

    const icon = document.createElement("span");
    icon.textContent = meta.icon;
    icon.setAttribute("aria-hidden", "true");

    const label = document.createElement("span");
    label.textContent = meta.label;

    item.append(icon, document.createTextNode(" "), label);

    item.addEventListener("dragstart", (event) => {
      item.setAttribute("aria-grabbed", "true");
      setDragPayload(event, { blockType: type });
    });
    item.addEventListener("dragend", () => {
      item.setAttribute("aria-grabbed", "false");
    });
    listEl.appendChild(item);
  }
}
