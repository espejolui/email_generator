import { importEmailHtml } from "../../core/import/importEmailHtml.js";
import type { EditorStore } from "../../core/store/store.js";

const MAX_FILE_BYTES = 2 * 1024 * 1024;

export function initTemplateImport(
  button: HTMLButtonElement,
  input: HTMLInputElement,
  store: EditorStore,
  liveEl: HTMLElement,
  onDocTitle: (title: string) => void,
): void {
  button.addEventListener("click", () => {
    input.click();
  });

  input.addEventListener("change", () => {
    void (async (): Promise<void> => {
      const file = input.files?.[0];
      input.value = "";
      if (file === undefined) return;
      if (file.size > MAX_FILE_BYTES) {
        liveEl.textContent = "No se pudo importar: el archivo supera el límite de 2 MB.";
        return;
      }
      try {
        const imported = importEmailHtml(await file.text());
        if (imported.blocks.length === 0) {
          liveEl.textContent = "No se encontraron bloques compatibles en el HTML seleccionado.";
          return;
        }
        if (store.blocks.length > 0 && !window.confirm("La importación reemplazará el contenido actual del lienzo. ¿Deseas continuar?")) {
          return;
        }
        store.load(imported.blocks, imported.background, imported.docTitle);
        onDocTitle(imported.docTitle);
        const ignored = imported.ignoredElements === 0
          ? ""
          : ` ${String(imported.ignoredElements)} elementos no compatibles se omitieron.`;
        liveEl.textContent = `Plantilla importada: ${String(imported.blocks.length)} bloques.${ignored}`;
      } catch (error: unknown) {
        const detail = error instanceof Error ? ` ${error.message}` : "";
        liveEl.textContent = `No se pudo importar el archivo.${detail}`;
      }
    })();
  });
}
