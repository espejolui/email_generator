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

function lucideIcon(name: string, label: string): HTMLElement {
  const icon = el("i", "icon");
  icon.setAttribute("data-lucide", name);
  icon.setAttribute("aria-hidden", "true");
  if (label !== "") icon.setAttribute("aria-label", label);
  return icon;
}

let openSelectList: HTMLElement | null = null;
let openSelectButton: HTMLButtonElement | null = null;
let selectDocClick: ((event: MouseEvent) => void) | null = null;
let selectDocKey: ((event: KeyboardEvent) => void) | null = null;

function closeSelect(): void {
  // Igual que closeColorPopover: cierre re-entrante (Escape en la lista y a
  // nivel de documento), se limpia el estado antes de tocar el DOM.
  const list = openSelectList;
  openSelectList = null;
  const button = openSelectButton;
  openSelectButton = null;
  const onClick = selectDocClick;
  selectDocClick = null;
  const onKey = selectDocKey;
  selectDocKey = null;
  try {
    list?.remove();
  } catch {
    // Ya separado por la llamada re-entrante: nada que hacer.
  }
  button?.setAttribute("aria-expanded", "false");
  button?.removeAttribute("data-select-open");
  if (onClick !== null) document.removeEventListener("click", onClick);
  if (onKey !== null) document.removeEventListener("keydown", onKey);
}

/**
 * Desplegable propio (el popup nativo del <select> lo pinta el SO y no
 * admite border-radius). Botón pill + lista con el diseño del editor.
 */
function selectField(
  current: string,
  options: ReadonlyArray<readonly [string, string]>,
  ariaLabel: string,
  idBase: string,
  labelText: string,
  onPick: (value: string) => void,
): HTMLElement {
  const wrap = el("div", "block__select");
  let selected = current;

  const labelEl = document.createElement("label");
  labelEl.textContent = labelText;
  labelEl.htmlFor = idBase;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "select-field";
  button.id = idBase;
  button.setAttribute("aria-haspopup", "listbox");
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-label", ariaLabel);

  const text = el("span", "select-field__text");
  const paint = (): void => {
    const found = options.find(([value]) => value === selected);
    text.textContent = found === undefined ? selected : found[1];
  };
  paint();
  button.append(text, lucideIcon("chevron-down", ""));

  const pick = (value: string): void => {
    selected = value;
    paint();
    onPick(value);
    closeSelect();
    button.focus();
  };

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    if (button.getAttribute("data-select-open") === "true") {
      closeSelect();
      return;
    }
    closeSelect();
    closeColorPopover();
    button.setAttribute("data-select-open", "true");
    button.setAttribute("aria-expanded", "true");

    const list = el("ul", "select-pop");
    list.setAttribute("role", "listbox");
    list.setAttribute("aria-label", ariaLabel);
    const items: HTMLLIElement[] = [];
    for (const [value, labelText] of options) {
      const item = el("li", "select-pop__option");
      item.setAttribute("role", "option");
      item.tabIndex = -1;
      item.dataset["value"] = value;
      item.textContent = labelText;
      if (value === selected) item.setAttribute("aria-selected", "true");
      item.addEventListener("click", () => {
        pick(value);
      });
      list.appendChild(item);
      items.push(item);
    }
    list.addEventListener("keydown", (ev) => {
      const active = document.activeElement;
      const index = active instanceof HTMLLIElement ? items.indexOf(active) : -1;
      if (ev.key === "ArrowDown") {
        ev.preventDefault();
        items[(index + 1) % items.length]?.focus();
      } else if (ev.key === "ArrowUp") {
        ev.preventDefault();
        items[(index - 1 + items.length) % items.length]?.focus();
      } else if (ev.key === "Enter") {
        ev.preventDefault();
        const value = items[index]?.dataset["value"] ?? "";
        if (value !== "") pick(value);
      } else if (ev.key === "Escape") {
        closeSelect();
        button.focus();
      }
    });

    wrap.appendChild(list);
    openSelectList = list;
    openSelectButton = button;

    selectDocClick = (ev: MouseEvent): void => {
      const target = ev.target;
      if (target instanceof Node && !list.contains(target)) closeSelect();
    };
    selectDocKey = (ev: KeyboardEvent): void => {
      if (ev.key === "Escape") {
        closeSelect();
        button.focus();
      }
    };
    document.addEventListener("click", selectDocClick);
    document.addEventListener("keydown", selectDocKey);

    const currentItem = items.find((item) => item.getAttribute("aria-selected") === "true");
    (currentItem ?? items[0])?.focus();
  });

  wrap.append(labelEl, button);
  return wrap;
}

const LEVEL_OPTIONS: ReadonlyArray<readonly [string, string]> = [
  ["1", "H1"],
  ["2", "H2"],
  ["3", "H3"],
  ["4", "H4"],
  ["5", "H5"],
  ["6", "H6"],
];

const BUTTON_COLOR_OPTIONS: ReadonlyArray<readonly [string, string]> = [
  ["green", "Verde WhatsApp"],
  ["blue", "Azul Comfacundi"],
];

const PRESET_COLORS: ReadonlyArray<string> = [
  "#41b6e6",
  "#8DE1F7",
  "#25d366",
  "#444444",
  "#111111",
  "#ffffff",
];

let openColorPopover: HTMLElement | null = null;
let openColorField: HTMLButtonElement | null = null;
let colorDocClick: ((event: MouseEvent) => void) | null = null;
let colorDocKey: ((event: KeyboardEvent) => void) | null = null;

function closeColorPopover(): void {
  // Se limpia el estado ANTES de tocar el DOM: el cierre es re-entrante
  // (Escape -> field.focus() -> blur/change -> cerrar otra vez) y el nodo
  // puede ya estar separado cuando llega la segunda llamada.
  const pop = openColorPopover;
  openColorPopover = null;
  const field = openColorField;
  openColorField = null;
  const onClick = colorDocClick;
  colorDocClick = null;
  const onKey = colorDocKey;
  colorDocKey = null;
  try {
    pop?.remove();
  } catch {
    // Ya separado por la llamada re-entrante: nada que hacer.
  }
  field?.setAttribute("aria-expanded", "false");
  field?.removeAttribute("data-color-open");
  if (onClick !== null) document.removeEventListener("click", onClick);
  if (onKey !== null) document.removeEventListener("keydown", onKey);
}

function optionalColor(
  pickerLabel: string,
  noneLabel: string,
  current: string,
  fallback: string,
  onChange: (value: string) => void,
): HTMLElement {
  const wrap = el("div", "block__color");
  const name = el("span", "block__color-name");
  name.textContent = pickerLabel;

  const field = document.createElement("button");
  field.type = "button";
  field.className = "color-field";
  field.setAttribute("aria-label", `Elegir color de ${pickerLabel.toLowerCase()}`);
  field.setAttribute("aria-haspopup", "dialog");
  field.setAttribute("aria-expanded", "false");

  const preview = el("span", "color-swatch");
  const paint = (value: string): void => {
    if (value === "") {
      preview.classList.add("is-none");
      preview.style.backgroundColor = "";
    } else {
      preview.classList.remove("is-none");
      preview.style.backgroundColor = value;
    }
  };
  // Espejo local del valor vigente: el lienzo no se re-renderiza ante
  // cambios de contenido, así que el panel debe leer esto al abrir
  // (no el `current` capturado al construir).
  let currentValue = current;
  paint(currentValue);
  field.appendChild(preview);

  field.addEventListener("click", (event) => {
    event.stopPropagation();
    if (field.getAttribute("data-color-open") === "true") {
      closeColorPopover();
      return;
    }
    closeColorPopover();
    field.setAttribute("data-color-open", "true");
    field.setAttribute("aria-expanded", "true");

    const pop = el("div", "color-pop");
    pop.setAttribute("role", "dialog");
    pop.setAttribute("aria-label", `Colores de ${pickerLabel.toLowerCase()}`);

    // HEX primero (texto) + selector nativo: ambos precargados con el valor
    // vigente (MDN: value precarga el campo y el selector) y sincronizados.
    const hex = document.createElement("input");
    hex.type = "text";
    hex.value = currentValue === "" ? fallback : currentValue;
    hex.placeholder = "#41b6e6";
    hex.maxLength = 7;
    hex.spellcheck = false;
    hex.setAttribute("aria-label", "Color personalizado en hexadecimal");

    const native = document.createElement("input");
    native.type = "color";
    native.value = currentValue === "" ? fallback : currentValue;
    native.setAttribute("aria-label", "Selector de color");

    const noneRow = el("label", "color-pop__none");
    const none = document.createElement("input");
    none.type = "checkbox";
    none.checked = currentValue === "";
    const noneText = document.createElement("span");
    noneText.textContent = noneLabel;
    noneRow.append(noneText, none);
    none.addEventListener("change", () => {
      if (none.checked) {
        currentValue = "";
      } else {
        currentValue = currentValue === "" ? fallback : currentValue;
        hex.value = currentValue;
        native.value = currentValue;
      }
      paint(currentValue);
      onChange(currentValue);
      closeColorPopover();
    });

    const grid = el("div", "color-pop__grid");
    for (const preset of PRESET_COLORS) {
      const swatch = document.createElement("button");
      swatch.type = "button";
      swatch.className = "color-swatch";
      swatch.dataset["color"] = preset;
      swatch.style.backgroundColor = preset;
      swatch.setAttribute("aria-label", `Color ${preset}`);
      swatch.addEventListener("click", () => {
        none.checked = false;
        hex.value = preset;
        native.value = preset;
        currentValue = preset;
        paint(preset);
        onChange(preset);
        closeColorPopover();
      });
      grid.appendChild(swatch);
    }

    const customRow = el("label", "color-pop__custom");
    const customText = document.createElement("span");
    customText.textContent = "Personalizado";
    customRow.append(hex, native, customText);

    hex.addEventListener("input", () => {
      const value = sanitizeColor(hex.value);
      if (value === "") return;
      currentValue = value;
      native.value = value;
      none.checked = false;
      paint(value);
      onChange(value);
    });
    hex.addEventListener("change", () => {
      closeColorPopover();
    });
    native.addEventListener("input", () => {
      const value = sanitizeColor(native.value);
      currentValue = value;
      hex.value = value;
      none.checked = false;
      paint(value);
      onChange(value);
    });
    native.addEventListener("change", () => {
      closeColorPopover();
    });

    pop.append(noneRow, grid, customRow);
    // El wrap original puede estar fuera del DOM (los hijos se reubican en
    // una fila compartida): anclar el panel al contenedor vivo del botón.
    const host = field.parentElement;
    if (host === null) return;
    host.appendChild(pop);
    openColorPopover = pop;
    openColorField = field;

    colorDocClick = (ev: MouseEvent): void => {
      const target = ev.target;
      if (target instanceof Node && !pop.contains(target)) closeColorPopover();
    };
    colorDocKey = (ev: KeyboardEvent): void => {
      if (ev.key === "Escape") {
        closeColorPopover();
        field.focus();
      }
    };
    document.addEventListener("click", colorDocClick);
    document.addEventListener("keydown", colorDocKey);
  });

  wrap.append(name, field);
  return wrap;
}

function bgControls(
  blockId: string,
  currentBg: string,
  onBg: (bg: string) => void,
): HTMLElement {
  return optionalColor("Fondo", "Sin fondo", currentBg, "#41b6e6", onBg);
}

/** Junta dos controles de color en una sola fila horizontal. */
function colorRow(first: HTMLElement, second: HTMLElement): HTMLElement {
  const row = el("div", "block__color");
  row.append(...Array.from(first.childNodes), ...Array.from(second.childNodes));
  return row;
}

/** Pareja etiqueta+control inseparable (nunca se parte en dos líneas). */
function inlinePair(labelText: string, control: HTMLElement, id: string): HTMLElement {
  const pair = el("span", "block__inline-option");
  pair.append(labelFor(labelText, control, id), control);
  return pair;
}

interface FormatFlags {
  readonly bold: boolean;
  readonly italic: boolean;
  readonly underline: boolean;
  readonly strike: boolean;
}

/** Casillas Negrita/Cursiva/Subrayado/Tachado en una fila horizontal. */
function formatRow(blockId: string, flags: FormatFlags, store: EditorStore): HTMLElement {
  const row = el("div", "block__inline");
  const defs = [
    ["bold", "Negrita"],
    ["italic", "Cursiva"],
    ["underline", "Subrayado"],
    ["strike", "Tachado"],
  ] as const;
  for (const [key, labelText] of defs) {
    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = flags[key];
    box.addEventListener("change", () => {
      const value = box.checked;
      if (key === "bold") store.update(blockId, { bold: value });
      else if (key === "italic") store.update(blockId, { italic: value });
      else if (key === "underline") store.update(blockId, { underline: value });
      else store.update(blockId, { strike: value });
    });
    row.appendChild(inlinePair(labelText, box, `${blockId}-fmt-${key}`));
  }
  return row;
}

function marginControls(
  blockId: string,
  top: number,
  bottom: number,
  onTop: (value: number) => void,
  onBottom: (value: number) => void,
): HTMLElement {
  const wrap = el("div", "block__margins");
  const topInput = document.createElement("input");
  topInput.type = "number";
  topInput.min = "0";
  topInput.max = "80";
  topInput.value = String(top);
  topInput.setAttribute("aria-label", "Margen superior en píxeles");
  topInput.addEventListener("input", () => {
    onTop(sanitizeMargin(topInput.value));
  });
  const bottomInput = document.createElement("input");
  bottomInput.type = "number";
  bottomInput.min = "0";
  bottomInput.max = "80";
  bottomInput.value = String(bottom);
  bottomInput.setAttribute("aria-label", "Margen inferior en píxeles");
  bottomInput.addEventListener("input", () => {
    onBottom(sanitizeMargin(bottomInput.value));
  });
  wrap.append(
    labelFor("Arriba (px)", topInput, `${blockId}-margintop`),
    topInput,
    labelFor("Abajo (px)", bottomInput, `${blockId}-marginbottom`),
    bottomInput,
  );
  return wrap;
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
        const level = selectField(String(block.level), LEVEL_OPTIONS, "Nivel del título", `${block.id}-level`, "Nivel", (value) => {
          const levelNumber = Number(value);
          store.update(block.id, { level: isTitleLevel(levelNumber) ? levelNumber : 2 });
        });
        const align = selectField(block.align, TEXT_ALIGN_OPTIONS, "Alineación del texto", `${block.id}-align`, "Alineación", (value) => {
          store.update(block.id, { align: isTextAlign(value) ? value : "left" });
        });
        const bg = bgControls(block.id, block.bg, (next) => {
          store.update(block.id, { bg: next });
        });
        const fg = optionalColor("Texto", "Automático", block.color, "#111111", (next) => {
          store.update(block.id, { color: next });
        });
        const titleColors = colorRow(bg, fg);
        const titleMargins = marginControls(
          block.id,
          block.marginTop,
          block.marginBottom,
          (n) => {
            store.update(block.id, { marginTop: n });
          },
          (n) => {
            store.update(block.id, { marginBottom: n });
          },
        );
        wrap.append(
          labelFor("Título", input, `${block.id}-title`),
          input,
          level,
          align,
          titleColors,
          formatRow(block.id, block, store),
          titleMargins,
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
        const textAlign = selectField(block.align, TEXT_ALIGN_OPTIONS, "Alineación del texto", `${block.id}-align`, "Alineación", (value) => {
          store.update(block.id, { align: isTextAlign(value) ? value : "left" });
        });
        const textBg = bgControls(block.id, block.bg, (next) => {
          store.update(block.id, { bg: next });
        });
        const textFg = optionalColor("Texto", "Automático", block.color, "#444444", (next) => {
          store.update(block.id, { color: next });
        });
        const textColors = colorRow(textBg, textFg);
        const textMargins = marginControls(
          block.id,
          block.marginTop,
          block.marginBottom,
          (n) => {
            store.update(block.id, { marginTop: n });
          },
          (n) => {
            store.update(block.id, { marginBottom: n });
          },
        );
        wrap.append(
          labelFor("Texto", area, `${block.id}-text`),
          area,
          textAlign,
          textColors,
          formatRow(block.id, block, store),
          textMargins,
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
        const listAlign = selectField(block.align, TEXT_ALIGN_OPTIONS, "Alineación del texto", `${block.id}-align`, "Alineación", (value) => {
          store.update(block.id, { align: isTextAlign(value) ? value : "left" });
        });
        const orderedRow = el("div", "block__inline");
        orderedRow.appendChild(inlinePair("Ordenada", ordered, `${block.id}-ordered`));
        wrap.append(
          labelFor("Puntos", area, `${block.id}-items`),
          area,
          orderedRow,
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
        const quoteAlign = selectField(block.align, TEXT_ALIGN_OPTIONS, "Alineación del texto", `${block.id}-align`, "Alineación", (value) => {
          store.update(block.id, { align: isTextAlign(value) ? value : "left" });
        });
        const quoteBg = bgControls(block.id, block.bg, (next) => {
          store.update(block.id, { bg: next });
        });
        const quoteFg = optionalColor("Texto", "Automático", block.color, "#555555", (next) => {
          store.update(block.id, { color: next });
        });
        const quoteRadius = document.createElement("input");
        quoteRadius.type = "number";
        quoteRadius.min = "0";
        quoteRadius.max = "80";
        quoteRadius.value = String(block.borderRadius);
        quoteRadius.setAttribute("aria-label", "Radio de bordes en píxeles");
        quoteRadius.addEventListener("input", () => {
          store.update(block.id, { borderRadius: sanitizeMargin(quoteRadius.value) });
        });
        wrap.append(
          labelFor("Cita", area, `${block.id}-quote`),
          area,
          labelFor("Autor", cite, `${block.id}-cite`),
          cite,
          quoteAlign,
          colorRow(quoteBg, quoteFg),
          labelFor("Radio (px)", quoteRadius, `${block.id}-radius`),
          quoteRadius,
          formatRow(block.id, block, store),
        );
        break;
      }
      case "divider": {
        const note = el("p", "block__note");
        note.textContent = "Separador horizontal";
        const divColor = optionalColor(
          "Línea",
          "Degradado",
          block.color,
          "#41b6e6",
          (next) => {
            store.update(block.id, { color: next });
          },
        );
        const divMargins = marginControls(
          block.id,
          block.marginTop,
          block.marginBottom,
          (n) => {
            store.update(block.id, { marginTop: n });
          },
          (n) => {
            store.update(block.id, { marginBottom: n });
          },
        );
        const thickness = document.createElement("input");
        thickness.type = "number";
        thickness.min = "0";
        thickness.max = "80";
        thickness.value = String(block.thickness);
        thickness.setAttribute("aria-label", "Grosor en píxeles");
        thickness.addEventListener("input", () => {
          store.update(block.id, { thickness: sanitizeMargin(thickness.value) });
        });
        wrap.append(
          note,
          divColor,
          divMargins,
          labelFor("Grosor (px)", thickness, `${block.id}-thickness`),
          thickness,
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
        const color = selectField(block.color, BUTTON_COLOR_OPTIONS, "Color del botón", `${block.id}-color`, "Color", (value) => {
          store.update(block.id, { color: isButtonColor(value) ? value : "green" });
        });
        const btnAlign = selectField(block.align, BUTTON_ALIGN_OPTIONS, "Alineación del botón", `${block.id}-align`, "Alineación", (value) => {
          store.update(block.id, { align: isButtonAlign(value) ? value : "center" });
        });
        const btnMargins = marginControls(
          block.id,
          block.marginTop,
          block.marginBottom,
          (n) => {
            store.update(block.id, { marginTop: n });
          },
          (n) => {
            store.update(block.id, { marginBottom: n });
          },
        );
        wrap.append(
          labelFor("Texto", label, `${block.id}-label`),
          label,
          labelFor("Celular", phone, `${block.id}-phone`),
          phone,
          labelFor("Mensaje", message, `${block.id}-message`),
          message,
          color,
          btnAlign,
          btnMargins,
        );
        break;
      }
    }
    return wrap;
  }
}
