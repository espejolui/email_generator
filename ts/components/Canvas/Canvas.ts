import { createBlockData, createId } from "../../blocks/index.js";
import type { AnyBlockData, ButtonAlign, TextAlign } from "../../blocks/types.js";
import { isButtonAlign, isButtonColor, isTextAlign, isTitleLevel } from "../../blocks/types.js";
import {
  getDragPayload,
  insertionIndexFor,
} from "../../core/dnd/dragController.js";
import {
  sanitizeAlt,
  sanitizeColor,
  sanitizeImageSrc,
  sanitizePhone,
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

const TEXT_ALIGN_OPTIONS: ReadonlyArray<readonly [TextAlign, string]> = [
  ["left", "Izquierda"],
  ["center", "Centrado"],
  ["justify", "Justificado"],
];

const BUTTON_ALIGN_OPTIONS: ReadonlyArray<readonly [ButtonAlign, string]> = [
  ["left", "Izquierda"],
  ["center", "Centrado"],
  ["right", "Derecha"],
];

function textAlignSelect(current: TextAlign, id: string): HTMLSelectElement {
  const select = document.createElement("select");
  select.setAttribute("aria-label", "Alineación del texto");
  for (const [value, text] of TEXT_ALIGN_OPTIONS) {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = text;
    if (current === value) opt.selected = true;
    select.appendChild(opt);
  }
  select.id = id;
  return select;
}

function buttonAlignSelect(current: ButtonAlign, id: string): HTMLSelectElement {
  const select = document.createElement("select");
  select.setAttribute("aria-label", "Alineación del botón");
  for (const [value, text] of BUTTON_ALIGN_OPTIONS) {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = text;
    if (current === value) opt.selected = true;
    select.appendChild(opt);
  }
  select.id = id;
  return select;
}

function bgControls(
  blockId: string,
  currentBg: string,
  onBg: (bg: string) => void,
): HTMLElement {
  const wrap = el("div", "block__bg");
  const picker = document.createElement("input");
  picker.type = "color";
  picker.value = currentBg === "" ? "#41b6e6" : currentBg;
  picker.setAttribute("aria-label", "Color de fondo");
  const none = document.createElement("input");
  none.type = "checkbox";
  none.checked = currentBg === "";
  const apply = (): void => {
    onBg(none.checked ? "" : sanitizeColor(picker.value));
  };
  picker.addEventListener("input", () => {
    none.checked = false;
    apply();
  });
  none.addEventListener("change", apply);
  wrap.append(
    labelFor("Fondo", picker, `${blockId}-bg`),
    picker,
    labelFor("Sin fondo", none, `${blockId}-bgnone`),
    none,
  );
  return wrap;
}

export function initCanvas(
  rootEl: HTMLElement,
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

  rootEl.addEventListener("dragover", (event) => {
    event.preventDefault();
    if (event.dataTransfer !== null) event.dataTransfer.dropEffect = "move";
    rootEl.classList.add("canvas--dragover");
    movePlaceholder(event.clientY);
  });
  rootEl.addEventListener("dragleave", (event) => {
    const to = event.relatedTarget;
    if (to instanceof Node && rootEl.contains(to)) return;
    rootEl.classList.remove("canvas--dragover");
    clearPlaceholder();
  });
  rootEl.addEventListener("drop", (event) => {
    rootEl.classList.remove("canvas--dragover");
    handleDrop(event);
  });

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
        for (const n of [1, 2, 3, 4, 5, 6] as const) {
          const opt = document.createElement("option");
          opt.value = String(n);
          opt.textContent = `H${String(n)}`;
          if (block.level === n) opt.selected = true;
          level.appendChild(opt);
        }
        level.addEventListener("change", () => {
          const v = Number(level.value);
          store.update(block.id, { level: isTitleLevel(v) ? v : 2 });
        });
        const align = textAlignSelect(block.align, `${block.id}-align`);
        align.addEventListener("change", () => {
          store.update(block.id, { align: isTextAlign(align.value) ? align.value : "left" });
        });
        const bg = bgControls(block.id, block.bg, (next) => {
          store.update(block.id, { bg: next });
        });
        wrap.append(
          labelFor("Título", input, `${block.id}-title`),
          input,
          labelFor("Nivel", level, `${block.id}-level`),
          level,
          labelFor("Alineación", align, `${block.id}-align`),
          align,
          bg,
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
        const textAlign = textAlignSelect(block.align, `${block.id}-align`);
        textAlign.addEventListener("change", () => {
          store.update(block.id, { align: isTextAlign(textAlign.value) ? textAlign.value : "left" });
        });
        const textBg = bgControls(block.id, block.bg, (next) => {
          store.update(block.id, { bg: next });
        });
        wrap.append(
          labelFor("Texto", area, `${block.id}-text`),
          area,
          labelFor("Alineación", textAlign, `${block.id}-align`),
          textAlign,
          textBg,
        );
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
        const capAlign = textAlignSelect(block.captionAlign, `${block.id}-capalign`);
        capAlign.addEventListener("change", () => {
          store.update(block.id, {
            captionAlign: isTextAlign(capAlign.value) ? capAlign.value : "left",
          });
        });
        wrap.append(
          labelFor("URL", src, `${block.id}-src`),
          src,
          labelFor("Alt", alt, `${block.id}-alt`),
          alt,
          labelFor("Pie", cap, `${block.id}-cap`),
          cap,
          labelFor("Alineación del pie", capAlign, `${block.id}-capalign`),
          capAlign,
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
        const listAlign = textAlignSelect(block.align, `${block.id}-align`);
        listAlign.addEventListener("change", () => {
          store.update(block.id, { align: isTextAlign(listAlign.value) ? listAlign.value : "left" });
        });
        wrap.append(
          labelFor("Puntos", area, `${block.id}-items`),
          area,
          labelFor("Ordenada", ordered, `${block.id}-ordered`),
          ordered,
          labelFor("Alineación", listAlign, `${block.id}-align`),
          listAlign,
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
        const quoteAlign = textAlignSelect(block.align, `${block.id}-align`);
        quoteAlign.addEventListener("change", () => {
          store.update(block.id, { align: isTextAlign(quoteAlign.value) ? quoteAlign.value : "left" });
        });
        wrap.append(
          labelFor("Cita", area, `${block.id}-quote`),
          area,
          labelFor("Autor", cite, `${block.id}-cite`),
          cite,
          labelFor("Alineación", quoteAlign, `${block.id}-align`),
          quoteAlign,
        );
        break;
      }
      case "divider": {
        const note = el("p", "block__note");
        note.textContent = "Separador horizontal";
        wrap.appendChild(note);
        break;
      }
      case "button": {
        const label = document.createElement("input");
        label.type = "text";
        label.value = block.label;
        label.placeholder = "Texto del botón";
        label.setAttribute("aria-label", "Texto del botón");
        label.addEventListener("input", () => {
          store.update(block.id, { label: sanitizeText(label.value).slice(0, 80) });
        });
        const phone = document.createElement("input");
        phone.type = "tel";
        phone.value = block.phone;
        phone.placeholder = "573224418087";
        phone.setAttribute("aria-label", "Celular con código país, solo dígitos");
        phone.addEventListener("input", () => {
          store.update(block.id, { phone: sanitizePhone(phone.value) });
        });
        const message = document.createElement("input");
        message.type = "text";
        message.value = block.message;
        message.placeholder = "Mensaje predeterminado";
        message.setAttribute("aria-label", "Mensaje predeterminado de WhatsApp");
        message.addEventListener("input", () => {
          // En crudo (recorte + tope): se codifica para URL al renderizar, nunca toca HTML.
          store.update(block.id, { message: message.value.trim().slice(0, 300) });
        });
        const color = document.createElement("select");
        color.setAttribute("aria-label", "Color del botón");
        for (const c of ["green", "blue"] as const) {
          const opt = document.createElement("option");
          opt.value = c;
          opt.textContent = c === "green" ? "Verde WhatsApp" : "Azul Comfacundi";
          if (block.color === c) opt.selected = true;
          color.appendChild(opt);
        }
        color.addEventListener("change", () => {
          store.update(block.id, { color: isButtonColor(color.value) ? color.value : "green" });
        });
        const btnAlign = buttonAlignSelect(block.align, `${block.id}-align`);
        btnAlign.addEventListener("change", () => {
          store.update(block.id, { align: isButtonAlign(btnAlign.value) ? btnAlign.value : "center" });
        });
        wrap.append(
          labelFor("Texto", label, `${block.id}-label`),
          label,
          labelFor("Celular", phone, `${block.id}-phone`),
          phone,
          labelFor("Mensaje", message, `${block.id}-message`),
          message,
          labelFor("Color", color, `${block.id}-color`),
          color,
          labelFor("Alineación", btnAlign, `${block.id}-align`),
          btnAlign,
        );
        break;
      }
    }
    return wrap;
  }
}
