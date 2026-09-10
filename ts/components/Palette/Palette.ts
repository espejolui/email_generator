import { getRegisteredBlocks } from "../../blocks/index.js";
import { setDragPayload } from "../../core/dnd/dragController.js";
import type { BlockType } from "../../blocks/types.js";
import { isBlockType } from "../../blocks/types.js";

export function initPalette(listEl: HTMLElement, onAdd: (type: BlockType) => void): void {
  listEl.replaceChildren();
  for (const meta of getRegisteredBlocks()) {
    if (!isBlockType(meta.type)) continue;
    const type: BlockType = meta.type;
    const item = document.createElement("li");
    item.draggable = true;
    item.tabIndex = 0;
    item.dataset["blockType"] = type;
    item.setAttribute("aria-grabbed", "false");
    item.title = "Arrastra al lienzo o pulsa Enter para añadir";

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
    // Alternativa accesible (teclado/táctil): añadir al final del lienzo.
    item.addEventListener("click", () => {
      onAdd(type);
    });
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onAdd(type);
      }
    });
    listEl.appendChild(item);
  }
}
