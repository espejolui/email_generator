import {
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
  let latestDoc = buildEmailDocument([]);

  store.subscribe((blocks) => {
    latestDoc = buildEmailDocument(blocks);
    // buildPreviewTable solo contiene markup propio + texto ya sanitizado.
    frameEl.innerHTML = buildPreviewTable(blocks);
    downloadBtn.disabled = blocks.length === 0;
  });

  downloadBtn.addEventListener("click", () => {
    downloadTemplate(latestDoc);
  });
}
