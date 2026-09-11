import {
  DEFAULT_TEMPLATE_BG,
  buildEmailDocument,
  buildPreviewTable,
} from "../../core/render/exportToEmailHtml.js";
import type { EditorStore } from "../../core/store/store.js";
import { downloadTemplate } from "./DownloadButton.js";

export function initPreview(
  frameEl: HTMLElement,
  downloadBtn: HTMLButtonElement,
  store: EditorStore,
): void {
  let latestDoc = buildEmailDocument([], store.background);

  // Control de fondo de plantilla en la barra del Preview (nivel plantilla,
  // no bloque): nativo <input type=color> ya entrega #rrggbb válido y el
  // store lo re-sanitiza. Sin duplicar el popover de color del Canvas.
  const toolbar = downloadBtn.closest(".preview__toolbar");
  const bgLabel = document.createElement("label");
  bgLabel.className = "preview__bg";
  const bgText = document.createElement("span");
  bgText.textContent = "Fondo";
  const bgInput = document.createElement("input");
  bgInput.type = "color";
  bgInput.value = store.background;
  bgInput.setAttribute("aria-label", "Color de fondo de la plantilla");
  bgInput.title = "Color de fondo de la plantilla";
  bgLabel.append(bgText, bgInput);
  if (toolbar !== null) {
    toolbar.insertBefore(bgLabel, downloadBtn);
  } else {
    frameEl.before(bgLabel);
  }

  bgInput.addEventListener("input", () => {
    store.setBackground(bgInput.value);
  });
  bgInput.addEventListener("change", () => {
    // El selector nativo puede cerrarse con Escape: re-sincroniza.
    bgInput.value = store.background === "" ? DEFAULT_TEMPLATE_BG : store.background;
  });

  store.subscribe((blocks, background) => {
    const bg = background === "" ? DEFAULT_TEMPLATE_BG : background;
    latestDoc = buildEmailDocument(blocks, bg);
    // buildPreviewTable solo contiene markup propio + texto ya sanitizado.
    frameEl.innerHTML = buildPreviewTable(blocks, bg);
    frameEl.style.backgroundColor = bg;
    if (bgInput.value.toLowerCase() !== bg.toLowerCase()) bgInput.value = bg;
    downloadBtn.disabled = blocks.length === 0;
  });

  downloadBtn.addEventListener("click", () => {
    downloadTemplate(latestDoc);
  });
}
