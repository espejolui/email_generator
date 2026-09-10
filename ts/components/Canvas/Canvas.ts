import { createBlockData, createId } from "../../blocks/index.js";
import type { AnyBlockData, ButtonAlign, TextAlign } from "../../blocks/types.js";
import { isButtonAlign, isButtonColor, isTextAlign, isTitleLevel } from "../../blocks/types.js";
import { getBlockMetadata } from "../../core/decorators/Block.js";
import {
  getDragPayload,
  insertionIndexFor,
} from "../../core/dnd/dragController.js";
import {
  sanitizeAlt,
  sanitizeColor,
  sanitizeImageSrc,
  sanitizeMargin,
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
  ["right", "Derecha"],
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

function optionalColor(
  blockId: string,
  key: string,
  pickerLabel: string,
  noneLabel: string,
  current: string,
  fallback: string,
  onChange: (value: string) => void,
): HTMLElement {
  const wrap = el("div", "block__color");
  const picker = document.createElement("input");
  picker.type = "color";
  picker.value = current === "" ? fallback : current;
  picker.setAttribute("aria-label", `Color de ${pickerLabel.toLowerCase()}`);
  const none = document.createElement("input");
  none.type = "checkbox";
  none.checked = current === "";
  const apply = (): void => {
    onChange(none.checked ? "" : sanitizeColor(picker.value));
  };
  picker.addEventListener("input", () => {
    none.checked = false;
    apply();
  });
  none.addEventListener("change", apply);
  wrap.append(
    labelFor(pickerLabel, picker, `${blockId}-${key}`),
    picker,
    labelFor(noneLabel, none, `${blockId}-${key}none`),
    none,
  );
  return wrap;
}

function bgControls(
  blockId: string,
  currentBg: string,
  onBg: (bg: string) => void,
): HTMLElement {
  return optionalColor(blockId, "bg", "Fondo", "Sin fondo", currentBg, "#41b6e6", onBg);
}

function refreshIcons(): void {
  window.lucide?.createIcons();
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
    refreshIcons();
  }

  function lucideIcon(name: string, label: string): HTMLElement {
    const icon = el("i", "icon");
    icon.setAttribute("data-lucide", name);
    icon.setAttribute("aria-hidden", "true");
    if (label !== "") icon.setAttribute("aria-label", label);
    return icon;
  }

  function renderItem(block: AnyBlockData, index: number, total: number): HTMLLIElement {
    const item = el("li", "block");
    item.dataset["blockId"] = block.id;

    const handle = el("span", "block__handle");
    handle.title = "Arrastra para reordenar";
    handle.draggable = true;
    handle.setAttribute("aria-label", "Arrastra para reordenar");
    handle.appendChild(lucideIcon("grip-vertical", ""));
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
    const meta = getBlockMetadata(block.type);
    const badge = el("span", "block__type");
    badge.title = meta?.label ?? block.type;
    badge.appendChild(lucideIcon(meta?.icon ?? "box", ""));
    const badgeLabel = el("span", "block__type-label");
    badgeLabel.textContent = meta?.label ?? block.type;
    badge.appendChild(badgeLabel);
    body.append(badge, renderFields(block));

    const actions = el("div", "block__actions");
    const up = el("button", "block__btn");
    up.type = "button";
    up.setAttribute("aria-label", "Subir bloque");
    up.appendChild(lucideIcon("chevron-up", ""));
    up.disabled = index === 0;
    up.addEventListener("click", () => {
      store.move(block.id, index - 1);
      announce(liveEl, "Bloque subido.");
    });
    const down = el("button", "block__btn");
    down.type = "button";
    down.setAttribute("aria-label", "Bajar bloque");
    down.appendChild(lucideIcon("chevron-down", ""));
    down.disabled = index === total - 1;
    down.addEventListener("click", () => {
      store.move(block.id, index + 1);
      announce(liveEl, "Bloque bajado.");
    });
    const del = el("button", "block__btn");
    del.type = "button";
    del.setAttribute("aria-label", "Eliminar bloque");
    del.appendChild(lucideIcon("trash-2", ""));
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
        const fg = optionalColor(block.id, "fg", "Texto", "Automático", block.color, "#111111", (next) => {
          store.update(block.id, { color: next });
        });
        wrap.append(
          labelFor("Título", input, `${block.id}-title`),
          input,
          labelFor("Nivel", level, `${block.id}-level`),
          level,
          labelFor("Alineación", align, `${block.id}-align`),
          align,
          bg,
          fg,
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
        const textFg = optionalColor(block.id, "fg", "Texto", "Automático", block.color, "#444444", (next) => {
          store.update(block.id, { color: next });
        });
        wrap.append(
          labelFor("Texto", area, `${block.id}-text`),
          area,
          labelFor("Alineación", textAlign, `${block.id}-align`),
          textAlign,
          textBg,
          textFg,
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
        wrap.append(
          labelFor("URL", src, `${block.id}-src`),
          src,
          labelFor("Alt", alt, `${block.id}-alt`),
          alt,
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
        const divColor = optionalColor(
          block.id,
          "divcolor",
          "Línea",
          "Degradado",
          block.color,
          "#41b6e6",
          (next) => {
            store.update(block.id, { color: next });
          },
        );
        const top = document.createElement("input");
        top.type = "number";
        top.min = "0";
        top.max = "80";
        top.value = String(block.marginTop);
        top.setAttribute("aria-label", "Margen superior en píxeles");
        top.addEventListener("input", () => {
          store.update(block.id, { marginTop: sanitizeMargin(top.value) });
        });
        const bottom = document.createElement("input");
        bottom.type = "number";
        bottom.min = "0";
        bottom.max = "80";
        bottom.value = String(block.marginBottom);
        bottom.setAttribute("aria-label", "Margen inferior en píxeles");
        bottom.addEventListener("input", () => {
          store.update(block.id, { marginBottom: sanitizeMargin(bottom.value) });
        });
        wrap.append(
          note,
          divColor,
          labelFor("Arriba (px)", top, `${block.id}-margintop`),
          top,
          labelFor("Abajo (px)", bottom, `${block.id}-marginbottom`),
          bottom,
        );
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
        phone.placeholder = "317 515 0821";
        phone.setAttribute("aria-label", "Celular sin indicativo, solo dígitos");
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
