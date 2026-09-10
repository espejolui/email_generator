import { createBlockData, createId } from "../../blocks/index.js";
import type { AnyBlockData } from "../../blocks/types.js";
import {
  getDragPayload,
  insertionIndexFor,
} from "../../core/dnd/dragController.js";
import {
  sanitizeAlt,
  sanitizeImageSrc,
  sanitizeText,
} from "../../core/sanitize/sanitize.js";
import type { EditorStore } from "../../core/store/store.js";

function announce(liveEl: HTMLElement, message: string): void {
  liveEl.textContent = "";
  liveEl.textContent = message;
}

function signature(blocks: readonly AnyBlockData[]): string {
  return blocks.map((b) => `${b.type}:${b.id}`).join("|");
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className !== undefined) node.className = className;
  return node;
}

function labelFor(text: string, control: HTMLElement, id: string): HTMLLabelElement {
  const label = document.createElement("label");
  label.textContent = text;
  label.htmlFor = id;
  control.id = id;
  return label;
}

export function initCanvas(
  listEl: HTMLElement,
  hintEl: HTMLElement,
  liveEl: HTMLElement,
  store: EditorStore,
): void {
  let renderedSig = "";
  let placeholder: HTMLLIElement | null = null;

  function ensurePlaceholder(): HTMLLIElement {
    if (placeholder === null) {
      placeholder = el("li", "canvas__placeholder");
      placeholder.textContent = "Suelta aquí";
      placeholder.setAttribute("aria-hidden", "true");
    }
    return placeholder;
  }

  function clearPlaceholder(): void {
    placeholder?.remove();
  }

  function movePlaceholder(clientY: number): void {
    const ph = ensurePlaceholder();
    const items = Array.from(listEl.querySelectorAll<HTMLElement>("[data-block-id]"));
    let inserted = false;
    for (const item of items) {
      const rect = item.getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) {
        listEl.insertBefore(ph, item);
        inserted = true;
        break;
      }
    }
    if (!inserted) listEl.appendChild(ph);
  }

  function handleDrop(event: DragEvent): void {
    event.preventDefault();
    clearPlaceholder();
    const payload = getDragPayload(event);
    if (payload === undefined) return;
    const index = insertionIndexFor(listEl, event.clientY);
    if (payload.sourceId !== undefined) {
      store.move(payload.sourceId, index);
      announce(liveEl, "Bloque reordenado.");
    } else {
      const id = createId();
      store.insertAt(index, createBlockData(payload.blockType, id));
      announce(liveEl, "Bloque añadido al lienzo.");
    }
  }

  listEl.addEventListener("dragover", (event) => {
    event.preventDefault();
    if (event.dataTransfer !== null) event.dataTransfer.dropEffect = "move";
    movePlaceholder(event.clientY);
  });
  listEl.addEventListener("dragleave", (event) => {
    if (event.target === listEl) clearPlaceholder();
  });
  listEl.addEventListener("drop", handleDrop);

  store.subscribe((blocks) => {
    hintEl.hidden = blocks.length > 0;
    const sig = signature(blocks);
    if (sig === renderedSig) return; // solo cambió contenido: no re-render (conserva foco)
    renderedSig = sig;
    render(blocks);
  });

  function render(blocks: readonly AnyBlockData[]): void {
    clearPlaceholder();
    listEl.replaceChildren();
    blocks.forEach((block, index) => {
      listEl.appendChild(renderItem(block, index, blocks.length));
    });
  }

  function renderItem(block: AnyBlockData, index: number, total: number): HTMLLIElement {
    const item = el("li", "block");
    item.dataset["blockId"] = block.id;

    const handle = el("span", "block__handle");
    handle.textContent = "⠿";
    handle.title = "Arrastra para reordenar";
    handle.draggable = true;
    handle.setAttribute("aria-label", "Arrastra para reordenar");
    handle.addEventListener("dragstart", (event) => {
      item.dataset["dragging"] = "true";
      if (event.dataTransfer !== null) {
        event.dataTransfer.setData(
          "application/json",
          JSON.stringify({ blockType: block.type, sourceId: block.id }),
        );
        event.dataTransfer.effectAllowed = "move";
      }
    });
    handle.addEventListener("dragend", () => {
      delete item.dataset["dragging"];
      clearPlaceholder();
    });

    const body = el("div", "block__body");
    body.appendChild(renderFields(block));

    const actions = el("div", "block__actions");
    const up = el("button", "block__btn");
    up.type = "button";
    up.textContent = "↑";
    up.setAttribute("aria-label", "Subir bloque");
    up.disabled = index === 0;
    up.addEventListener("click", () => {
      store.move(block.id, index - 1);
      announce(liveEl, "Bloque subido.");
    });
    const down = el("button", "block__btn");
    down.type = "button";
    down.textContent = "↓";
    down.setAttribute("aria-label", "Bajar bloque");
    down.disabled = index === total - 1;
    down.addEventListener("click", () => {
      store.move(block.id, index + 1);
      announce(liveEl, "Bloque bajado.");
    });
    const del = el("button", "block__btn");
    del.type = "button";
    del.textContent = "✕";
    del.setAttribute("aria-label", "Eliminar bloque");
    del.addEventListener("click", () => {
      store.remove(block.id);
      announce(liveEl, "Bloque eliminado.");
    });
    actions.append(up, down, del);

    item.append(handle, body, actions);
    return item;
  }

  function renderFields(block: AnyBlockData): HTMLElement {
    const wrap = el("div", "block__fields");
    switch (block.type) {
      case "title": {
        const input = document.createElement("input");
        input.type = "text";
        input.value = block.content;
        input.placeholder = "Título";
        input.setAttribute("aria-label", "Contenido del título");
        input.addEventListener("input", () => {
          store.update(block.id, { content: sanitizeText(input.value).slice(0, 300) });
        });
        const level = document.createElement("select");
        level.setAttribute("aria-label", "Nivel del título");
        for (const n of [1, 2, 3] as const) {
          const opt = document.createElement("option");
          opt.value = String(n);
          opt.textContent = `H${String(n)}`;
          if (block.level === n) opt.selected = true;
          level.appendChild(opt);
        }
        level.addEventListener("change", () => {
          const v = Number(level.value);
          store.update(block.id, { level: v === 1 ? 1 : v === 3 ? 3 : 2 });
        });
        wrap.append(
          labelFor("Título", input, `${block.id}-title`),
          input,
          labelFor("Nivel", level, `${block.id}-level`),
          level,
        );
        break;
      }
      case "text": {
        const area = document.createElement("textarea");
        area.rows = 3;
        area.value = block.content;
        area.placeholder = "Texto…";
        area.setAttribute("aria-label", "Contenido del texto");
        area.addEventListener("input", () => {
          store.update(block.id, { content: sanitizeText(area.value).slice(0, 2000) });
        });
        wrap.append(labelFor("Texto", area, `${block.id}-text`), area);
        break;
      }
      case "image": {
        const src = document.createElement("input");
        src.type = "url";
        src.value = block.src;
        src.placeholder = "https://…";
        src.setAttribute("aria-label", "URL de la imagen (https)");
        src.addEventListener("input", () => {
          store.update(block.id, { src: sanitizeImageSrc(src.value) });
        });
        const alt = document.createElement("input");
        alt.type = "text";
        alt.value = block.alt;
        alt.placeholder = "Texto alternativo";
        alt.addEventListener("input", () => {
          store.update(block.id, { alt: sanitizeAlt(alt.value) });
        });
        const cap = document.createElement("input");
        cap.type = "text";
        cap.value = block.caption;
        cap.placeholder = "Pie de foto (opcional)";
        cap.addEventListener("input", () => {
          store.update(block.id, { caption: sanitizeText(cap.value).slice(0, 300) });
        });
        wrap.append(
          labelFor("URL", src, `${block.id}-src`),
          src,
          labelFor("Alt", alt, `${block.id}-alt`),
          alt,
          labelFor("Pie", cap, `${block.id}-cap`),
          cap,
        );
        break;
      }
      case "list": {
        const area = document.createElement("textarea");
        area.rows = 3;
        area.value = block.items.join("\n");
        area.placeholder = "Un punto por línea";
        area.setAttribute("aria-label", "Elementos de la lista, uno por línea");
        area.addEventListener("input", () => {
          const items = area.value
            .split("\n")
            .slice(0, 20)
            .map((v) => sanitizeText(v).slice(0, 300));
          store.update(block.id, { items: items.length > 0 ? items : [""] });
        });
        const ordered = document.createElement("input");
        ordered.type = "checkbox";
        ordered.checked = block.ordered;
        ordered.addEventListener("change", () => {
          store.update(block.id, { ordered: ordered.checked });
        });
        wrap.append(
          labelFor("Puntos", area, `${block.id}-items`),
          area,
          labelFor("Ordenada", ordered, `${block.id}-ordered`),
          ordered,
        );
        break;
      }
      case "quote": {
        const area = document.createElement("textarea");
        area.rows = 2;
        area.value = block.content;
        area.placeholder = "Cita…";
        area.addEventListener("input", () => {
          store.update(block.id, { content: sanitizeText(area.value).slice(0, 1000) });
        });
        const cite = document.createElement("input");
        cite.type = "text";
        cite.value = block.cite;
        cite.placeholder = "Autor (opcional)";
        cite.addEventListener("input", () => {
          store.update(block.id, { cite: sanitizeText(cite.value).slice(0, 200) });
        });
        wrap.append(
          labelFor("Cita", area, `${block.id}-quote`),
          area,
          labelFor("Autor", cite, `${block.id}-cite`),
          cite,
        );
        break;
      }
      case "divider": {
        const note = el("p", "block__note");
        note.textContent = "Separador horizontal";
        wrap.appendChild(note);
        break;
      }
    }
    return wrap;
  }
}
