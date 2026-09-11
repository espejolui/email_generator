import { createBlockData, createId, getRegisteredBlocks } from "../../blocks/index.js";
import type {
  AnyBlockData,
  BlockType,
  ButtonAlign,
  ColumnData,
  SocialUrls,
  TextAlign,
} from "../../blocks/types.js";
import {
  isBlockType,
  isButtonAlign,
  isButtonColor,
  isTextAlign,
  isTitleLevel,
} from "../../blocks/types.js";
import { getBlockMetadata } from "../../core/decorators/Block.js";
import {
  getDragPayload,
  insertionIndexFor,
  setDragPayload,
} from "../../core/dnd/dragController.js";
import {
  sanitizeAlt,
  sanitizeColor,
  sanitizeHttpsUrl,
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

function innerSignature(block: AnyBlockData): string {
  if (block.type !== "columns") return `${block.type}:${block.id}`;
  return `columns:${block.id}(${block.columns
    .map((col) => col.blocks.map(innerSignature).join(","))
    .join(";")})`;
}

function signature(blocks: readonly AnyBlockData[]): string {
  return blocks.map(innerSignature).join("|");
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

const SOCIAL_NETWORKS: ReadonlyArray<readonly [keyof SocialUrls, string]> = [
  ["instagram", "Instagram"],
  ["facebook", "Facebook"],
  ["x", "X"],
  ["linkedin", "LinkedIn"],
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
  clearBtn: HTMLButtonElement,
): void {
  let renderedSig = "";
  let placeholder: HTMLLIElement | null = null;
  let latestBlocks: readonly AnyBlockData[] = [];

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
    // Los arrastres nacidos en una columna se gestionan en su propia lista;
    // aquí se ignoran para no mover un id interno en el nivel superior.
    if (payload.fromColumn !== undefined) return;
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

  /** Lee el bloque `columns` vigente por id (o undefined si ya no existe). */
  function liveColumns(columnsId: string): AnyBlockData | undefined {
    return latestBlocks.find((b) => b.id === columnsId);
  }

  function writeColumns(columnsId: string, columns: readonly ColumnData[]): void {
    store.update(columnsId, { columns });
  }

  function cloneColumns(columns: readonly ColumnData[]): { blocks: AnyBlockData[] }[] {
    return columns.map((col) => ({ blocks: [...col.blocks] }));
  }

  /**
   * Drop en la lista de una columna: clona desde la paleta, acoge un bloque
   * del nivel superior o reordena/mueve bloques internos. Todo vía
   * `update` mayorista: el store no cambia.
   */
  function handleColumnDrop(
    event: DragEvent,
    list: HTMLElement,
    columnsId: string,
    colIndex: number,
  ): void {
    event.preventDefault();
    event.stopPropagation();
    clearPlaceholder();
    const payload = getDragPayload(event);
    if (payload === undefined) return;
    const host = liveColumns(columnsId);
    if (host === undefined || host.type !== "columns") return;
    const items = Array.from(list.querySelectorAll<HTMLElement>("[data-nested-id]"));
    let target = items.length;
    for (let i = 0; i < items.length; i += 1) {
      const rect = items[i]?.getBoundingClientRect();
      if (rect === undefined) continue;
      if (event.clientY < rect.top + rect.height / 2) {
        target = i;
        break;
      }
    }
    const next = cloneColumns(host.columns);
    const dest = next[colIndex];
    if (dest === undefined) return;

    if (payload.sourceId === undefined) {
      dest.blocks = [
        ...dest.blocks.slice(0, target),
        createBlockData(payload.blockType, createId()),
        ...dest.blocks.slice(target),
      ];
      writeColumns(columnsId, next);
      announce(liveEl, "Bloque añadido a la columna.");
      return;
    }

    const from = payload.fromColumn;
    if (from !== undefined && from.columnsId === columnsId) {
      const origin = next[from.colIndex];
      if (origin === undefined) return;
      const at = origin.blocks.findIndex((b) => b.id === payload.sourceId);
      if (at === -1) return;
      const [moving] = origin.blocks.splice(at, 1);
      if (moving === undefined) return;
      const into = next[colIndex];
      if (into === undefined) return;
      let at2 = target;
      if (from.colIndex === colIndex && at < target) at2 = target - 1;
      into.blocks = [...into.blocks.slice(0, at2), moving, ...into.blocks.slice(at2)];
      writeColumns(columnsId, next);
      announce(liveEl, "Bloque reordenado en la columna.");
      return;
    }

    if (from !== undefined) {
      const other = liveColumns(from.columnsId);
      if (other === undefined || other.type !== "columns") return;
      const foreign = cloneColumns(other.columns);
      const origin = foreign[from.colIndex];
      if (origin === undefined) return;
      const at = origin.blocks.findIndex((b) => b.id === payload.sourceId);
      if (at === -1) return;
      const [moving] = origin.blocks.splice(at, 1);
      if (moving === undefined) return;
      dest.blocks = [
        ...dest.blocks.slice(0, target),
        moving,
        ...dest.blocks.slice(target),
      ];
      writeColumns(from.columnsId, foreign);
      writeColumns(columnsId, next);
      announce(liveEl, "Bloque movido de columna.");
      return;
    }

    const top = latestBlocks.find((b) => b.id === payload.sourceId);
    if (top === undefined) return;
    store.remove(top.id);
    dest.blocks = [...dest.blocks.slice(0, target), top, ...dest.blocks.slice(target)];
    writeColumns(columnsId, next);
    announce(liveEl, "Bloque movido a la columna.");
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

  clearBtn.addEventListener("click", () => {
    const count = store.blocks.length;
    if (count === 0) return;
    store.clear();
    announce(liveEl, count === 1 ? "Lienzo vaciado: 1 bloque eliminado." : `Lienzo vaciado: ${String(count)} bloques eliminados.`);
  });

  store.subscribe((blocks) => {
    latestBlocks = blocks;
    hintEl.hidden = blocks.length > 0;
    clearBtn.disabled = blocks.length === 0;
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

  /** Mueve un bloque interno dentro de su columna (pasos +/-1). */
  function moveNested(columnsId: string, innerId: string, delta: number): void {
    const host = liveColumns(columnsId);
    if (host === undefined || host.type !== "columns") return;
    const next = cloneColumns(host.columns);
    for (const col of next) {
      const at = col.blocks.findIndex((b) => b.id === innerId);
      if (at === -1) continue;
      const to = at + delta;
      if (to < 0 || to >= col.blocks.length) return;
      const copy = [...col.blocks];
      const [moving] = copy.splice(at, 1);
      if (moving === undefined) return;
      copy.splice(to, 0, moving);
      col.blocks = copy;
      writeColumns(columnsId, next);
      announce(liveEl, delta < 0 ? "Bloque subido." : "Bloque bajado.");
      return;
    }
  }

  /** Quita un bloque interno de su columna. */
  function removeNested(columnsId: string, innerId: string): void {
    const host = liveColumns(columnsId);
    if (host === undefined || host.type !== "columns") return;
    const next = cloneColumns(host.columns).map((col) => ({
      blocks: col.blocks.filter((b) => b.id !== innerId),
    }));
    writeColumns(columnsId, next);
    announce(liveEl, "Bloque eliminado de la columna.");
  }

  /**
   * Fila compacta de bloque anidado: asa de arrastre (origen de columna en
   * el payload), campos reutilizados vía `renderFields` y acciones
   * mayoristas. Recursivo: admite columnas dentro de columnas.
   */
  function renderNestedItem(
    columnsId: string,
    colIndex: number,
    inner: AnyBlockData,
    innerIndex: number,
    innerTotal: number,
  ): HTMLLIElement {
    const item = el("li", "block block--nested");
    item.dataset["nestedId"] = inner.id;

    const handle = el("span", "block__handle");
    handle.title = "Arrastra para reordenar en la columna";
    handle.draggable = true;
    handle.setAttribute("aria-label", "Arrastra para reordenar en la columna");
    handle.appendChild(lucideIcon("grip-vertical", ""));
    handle.addEventListener("dragstart", (event) => {
      item.dataset["dragging"] = "true";
      setDragPayload(event, {
        blockType: inner.type,
        sourceId: inner.id,
        fromColumn: { columnsId, colIndex },
      });
    });
    handle.addEventListener("dragend", () => {
      delete item.dataset["dragging"];
      clearPlaceholder();
    });

    const body = el("div", "block__body");
    const meta = getBlockMetadata(inner.type);
    const badge = el("span", "block__type");
    badge.title = meta?.label ?? inner.type;
    badge.appendChild(lucideIcon(meta?.icon ?? "box", ""));
    const badgeLabel = el("span", "block__type-label");
    badgeLabel.textContent = meta?.label ?? inner.type;
    badge.appendChild(badgeLabel);
    body.append(badge, renderFields(inner));

    const actions = el("div", "block__actions");
    const up = el("button", "block__btn");
    up.type = "button";
    up.setAttribute("aria-label", "Subir bloque en la columna");
    up.appendChild(lucideIcon("chevron-up", ""));
    up.disabled = innerIndex === 0;
    up.addEventListener("click", () => {
      moveNested(columnsId, inner.id, -1);
    });
    const down = el("button", "block__btn");
    down.type = "button";
    down.setAttribute("aria-label", "Bajar bloque en la columna");
    down.appendChild(lucideIcon("chevron-down", ""));
    down.disabled = innerIndex === innerTotal - 1;
    down.addEventListener("click", () => {
      moveNested(columnsId, inner.id, 1);
    });
    const del = el("button", "block__btn");
    del.type = "button";
    del.setAttribute("aria-label", "Quitar bloque de la columna");
    del.appendChild(lucideIcon("trash-2", ""));
    del.addEventListener("click", () => {
      removeNested(columnsId, inner.id);
    });
    actions.append(up, down, del);

    item.append(handle, body, actions);
    return item;
  }

  /**
   * Cuatro URLs de redes para `footer` y `social`. Lee el valor vigente en
   * cada evento (no el capturado al renderizar) para no pisar ediciones.
   */
  function appendSocialFields(wrap: HTMLElement, blockId: string): void {
    const current = (): SocialUrls => {
      const live = latestBlocks.find((b) => b.id === blockId);
      if (live !== undefined && (live.type === "footer" || live.type === "social")) {
        return live.social;
      }
      return { instagram: "", facebook: "", x: "", linkedin: "" };
    };
    const initial = current();
    for (const [key, labelText] of SOCIAL_NETWORKS) {
      const input = document.createElement("input");
      input.type = "url";
      input.value = initial[key];
      input.placeholder = "https://…";
      input.setAttribute("aria-label", `URL de ${labelText} (https)`);
      input.addEventListener("input", () => {
        store.update(blockId, {
          social: { ...current(), [key]: sanitizeHttpsUrl(input.value) },
        });
      });
      wrap.append(labelFor(labelText, input, `${blockId}-social-${key}`), input);
    }
  }

  function moveColPlaceholder(ul: HTMLElement, clientY: number): void {
    const ph = ensurePlaceholder();
    const items = Array.from(ul.querySelectorAll<HTMLElement>("[data-nested-id]"));
    for (const item of items) {
      const rect = item.getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) {
        ul.insertBefore(ph, item);
        return;
      }
    }
    ul.appendChild(ph);
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
        const quoteMargins = marginControls(
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
          labelFor("Cita", area, `${block.id}-quote`),
          area,
          labelFor("Autor", cite, `${block.id}-cite`),
          cite,
          quoteAlign,
          colorRow(quoteBg, quoteFg),
          formatRow(block.id, block, store),
          quoteMargins,
        );
        break;
      }
      case "divider": {
        const note = el("p", "block__note");
        note.textContent = "Separador horizontal";
        const divColor = optionalColor(
          "Línea",
          "Por defecto",
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
        const radius = document.createElement("input");
        radius.type = "number";
        radius.min = "0";
        radius.max = "80";
        radius.value = String(block.borderRadius);
        radius.setAttribute("aria-label", "Radio de bordes en píxeles");
        radius.addEventListener("input", () => {
          store.update(block.id, { borderRadius: sanitizeMargin(radius.value) });
        });
        wrap.append(
          note,
          divColor,
          divMargins,
          labelFor("Grosor (px)", thickness, `${block.id}-thickness`),
          thickness,
          labelFor("Radio (px)", radius, `${block.id}-radius`),
          radius,
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
      case "spacer": {
        const height = document.createElement("input");
        height.type = "number";
        height.min = "0";
        height.max = "80";
        height.value = String(block.height);
        height.setAttribute("aria-label", "Altura en píxeles");
        height.addEventListener("input", () => {
          store.update(block.id, { height: sanitizeMargin(height.value) });
        });
        wrap.append(labelFor("Altura (px)", height, `${block.id}-height`), height);
        break;
      }
      case "header": {
        const logo = document.createElement("input");
        logo.type = "url";
        logo.value = block.logoSrc;
        logo.placeholder = "https://…";
        logo.setAttribute("aria-label", "URL del logo (https)");
        logo.addEventListener("input", () => {
          store.update(block.id, { logoSrc: sanitizeImageSrc(logo.value) });
        });
        const logoAlt = document.createElement("input");
        logoAlt.type = "text";
        logoAlt.value = block.logoAlt;
        logoAlt.placeholder = "Texto alternativo del logo";
        logoAlt.addEventListener("input", () => {
          store.update(block.id, { logoAlt: sanitizeAlt(logoAlt.value) });
        });
        const tagline = document.createElement("input");
        tagline.type = "text";
        tagline.value = block.tagline;
        tagline.placeholder = "Tagline";
        tagline.setAttribute("aria-label", "Tagline del encabezado");
        tagline.addEventListener("input", () => {
          store.update(block.id, { tagline: sanitizeText(tagline.value).slice(0, 200) });
        });
        const headerAlign = selectField(block.align, TEXT_ALIGN_OPTIONS, "Alineación del encabezado", `${block.id}-align`, "Alineación", (value) => {
          store.update(block.id, { align: isTextAlign(value) ? value : "center" });
        });
        wrap.append(
          labelFor("Logo", logo, `${block.id}-logo`),
          logo,
          labelFor("Alt logo", logoAlt, `${block.id}-logoalt`),
          logoAlt,
          labelFor("Tagline", tagline, `${block.id}-tagline`),
          tagline,
          headerAlign,
        );
        break;
      }
      case "footer": {
        const address = document.createElement("textarea");
        address.rows = 2;
        address.value = block.address;
        address.placeholder = "Dirección física";
        address.setAttribute("aria-label", "Dirección física del pie");
        address.addEventListener("input", () => {
          store.update(block.id, { address: sanitizeText(address.value).slice(0, 500) });
        });
        const unsubscribe = document.createElement("input");
        unsubscribe.type = "url";
        unsubscribe.value = block.unsubscribeUrl;
        unsubscribe.placeholder = "https://…/unsubscribe";
        unsubscribe.setAttribute("aria-label", "URL de darse de baja (https)");
        unsubscribe.addEventListener("input", () => {
          store.update(block.id, { unsubscribeUrl: sanitizeHttpsUrl(unsubscribe.value) });
        });
        wrap.append(
          labelFor("Dirección", address, `${block.id}-address`),
          address,
          labelFor("Unsubscribe", unsubscribe, `${block.id}-unsub`),
          unsubscribe,
        );
        appendSocialFields(wrap, block.id);
        break;
      }
      case "social": {
        appendSocialFields(wrap, block.id);
        break;
      }
      case "banner": {
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
        const href = document.createElement("input");
        href.type = "url";
        href.value = block.href;
        href.placeholder = "https://… (video o destino)";
        href.setAttribute("aria-label", "URL de destino (https)");
        href.addEventListener("input", () => {
          store.update(block.id, { href: sanitizeHttpsUrl(href.value) });
        });
        const caption = document.createElement("input");
        caption.type = "text";
        caption.value = block.caption;
        caption.placeholder = "▶ Ver video";
        caption.setAttribute("aria-label", "Texto del pie (opcional)");
        caption.addEventListener("input", () => {
          store.update(block.id, { caption: sanitizeText(caption.value).slice(0, 120) });
        });
        wrap.append(
          labelFor("Imagen", src, `${block.id}-src`),
          src,
          labelFor("Alt", alt, `${block.id}-alt`),
          alt,
          labelFor("Enlace", href, `${block.id}-href`),
          href,
          labelFor("Pie", caption, `${block.id}-caption`),
          caption,
        );
        break;
      }
      case "product": {
        const src = document.createElement("input");
        src.type = "url";
        src.value = block.src;
        src.placeholder = "https://…";
        src.setAttribute("aria-label", "URL de la imagen del producto (https)");
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
        const name = document.createElement("input");
        name.type = "text";
        name.value = block.name;
        name.placeholder = "Nombre del producto";
        name.setAttribute("aria-label", "Nombre del producto");
        name.addEventListener("input", () => {
          store.update(block.id, { name: sanitizeText(name.value).slice(0, 120) });
        });
        const price = document.createElement("input");
        price.type = "text";
        price.value = block.price;
        price.placeholder = "$0";
        price.setAttribute("aria-label", "Precio del producto");
        price.addEventListener("input", () => {
          store.update(block.id, { price: sanitizeText(price.value).slice(0, 40) });
        });
        const url = document.createElement("input");
        url.type = "url";
        url.value = block.url;
        url.placeholder = "https://…";
        url.setAttribute("aria-label", "URL del producto (https)");
        url.addEventListener("input", () => {
          store.update(block.id, { url: sanitizeHttpsUrl(url.value) });
        });
        const buttonLabel = document.createElement("input");
        buttonLabel.type = "text";
        buttonLabel.value = block.buttonLabel;
        buttonLabel.placeholder = "Comprar";
        buttonLabel.setAttribute("aria-label", "Texto del botón");
        buttonLabel.addEventListener("input", () => {
          store.update(block.id, { buttonLabel: sanitizeText(buttonLabel.value).slice(0, 40) });
        });
        const color = selectField(block.color, BUTTON_COLOR_OPTIONS, "Color del botón", `${block.id}-color`, "Color", (value) => {
          store.update(block.id, { color: isButtonColor(value) ? value : "blue" });
        });
        wrap.append(
          labelFor("Imagen", src, `${block.id}-src`),
          src,
          labelFor("Alt", alt, `${block.id}-alt`),
          alt,
          labelFor("Nombre", name, `${block.id}-name`),
          name,
          labelFor("Precio", price, `${block.id}-price`),
          price,
          labelFor("URL", url, `${block.id}-url`),
          url,
          labelFor("Botón", buttonLabel, `${block.id}-buttonlabel`),
          buttonLabel,
          color,
        );
        break;
      }
      case "coupon": {
        const code = document.createElement("input");
        code.type = "text";
        code.value = block.code;
        code.placeholder = "DESCUENTO10";
        code.setAttribute("aria-label", "Código del cupón");
        code.addEventListener("input", () => {
          store.update(block.id, { code: sanitizeText(code.value).slice(0, 40) });
        });
        const description = document.createElement("input");
        description.type = "text";
        description.value = block.description;
        description.placeholder = "Descripción del cupón";
        description.setAttribute("aria-label", "Descripción del cupón");
        description.addEventListener("input", () => {
          store.update(block.id, { description: sanitizeText(description.value).slice(0, 200) });
        });
        wrap.append(
          labelFor("Código", code, `${block.id}-code`),
          code,
          labelFor("Descripción", description, `${block.id}-description`),
          description,
        );
        break;
      }
      case "signature": {
        const name = document.createElement("input");
        name.type = "text";
        name.value = block.name;
        name.placeholder = "Tu nombre";
        name.setAttribute("aria-label", "Nombre del remitente");
        name.addEventListener("input", () => {
          store.update(block.id, { name: sanitizeText(name.value).slice(0, 120) });
        });
        const role = document.createElement("input");
        role.type = "text";
        role.value = block.role;
        role.placeholder = "Tu cargo";
        role.setAttribute("aria-label", "Cargo del remitente");
        role.addEventListener("input", () => {
          store.update(block.id, { role: sanitizeText(role.value).slice(0, 120) });
        });
        const photo = document.createElement("input");
        photo.type = "url";
        photo.value = block.photoSrc;
        photo.placeholder = "https://…";
        photo.setAttribute("aria-label", "URL de la foto (https)");
        photo.addEventListener("input", () => {
          store.update(block.id, { photoSrc: sanitizeImageSrc(photo.value) });
        });
        const photoAlt = document.createElement("input");
        photoAlt.type = "text";
        photoAlt.value = block.photoAlt;
        photoAlt.placeholder = "Texto alternativo de la foto";
        photoAlt.addEventListener("input", () => {
          store.update(block.id, { photoAlt: sanitizeAlt(photoAlt.value) });
        });
        wrap.append(
          labelFor("Nombre", name, `${block.id}-name`),
          name,
          labelFor("Cargo", role, `${block.id}-role`),
          role,
          labelFor("Foto", photo, `${block.id}-photo`),
          photo,
          labelFor("Alt foto", photoAlt, `${block.id}-photoalt`),
          photoAlt,
        );
        break;
      }
      case "cta": {
        const ctaLabel = document.createElement("input");
        ctaLabel.type = "text";
        ctaLabel.value = block.label;
        ctaLabel.placeholder = "Texto del botón";
        ctaLabel.setAttribute("aria-label", "Texto del botón");
        ctaLabel.addEventListener("input", () => {
          store.update(block.id, { label: sanitizeText(ctaLabel.value).slice(0, 80) });
        });
        const url = document.createElement("input");
        url.type = "url";
        url.value = block.url;
        url.placeholder = "https://…";
        url.setAttribute("aria-label", "URL de destino (https)");
        url.addEventListener("input", () => {
          store.update(block.id, { url: sanitizeHttpsUrl(url.value) });
        });
        const ctaColor = selectField(block.color, BUTTON_COLOR_OPTIONS, "Color del botón", `${block.id}-color`, "Color", (value) => {
          store.update(block.id, { color: isButtonColor(value) ? value : "blue" });
        });
        const ctaAlign = selectField(block.align, BUTTON_ALIGN_OPTIONS, "Alineación del botón", `${block.id}-align`, "Alineación", (value) => {
          store.update(block.id, { align: isButtonAlign(value) ? value : "center" });
        });
        const ctaMargins = marginControls(
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
          labelFor("Texto", ctaLabel, `${block.id}-label`),
          ctaLabel,
          labelFor("URL", url, `${block.id}-url`),
          url,
          ctaColor,
          ctaAlign,
          ctaMargins,
        );
        break;
      }
      case "columns": {
        const colsWrap = el("div", "block__cols");
        block.columns.forEach((col, colIndex) => {
          const colBox = el("div", "block__col");
          const colTitle = el("p", "block__coltitle");
          colTitle.textContent = `Columna ${String(colIndex + 1)}`;
          const ul = el("ul", "block__collist");
          ul.setAttribute("aria-label", `Bloques de la columna ${String(colIndex + 1)}`);
          col.blocks.forEach((inner, innerIndex) => {
            ul.appendChild(renderNestedItem(block.id, colIndex, inner, innerIndex, col.blocks.length));
          });
          ul.addEventListener("dragover", (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (event.dataTransfer !== null) event.dataTransfer.dropEffect = "move";
            moveColPlaceholder(ul, event.clientY);
          });
          ul.addEventListener("dragleave", (event) => {
            const to = event.relatedTarget;
            if (to instanceof Node && ul.contains(to)) return;
            clearPlaceholder();
          });
          ul.addEventListener("drop", (event) => {
            handleColumnDrop(event, ul, block.id, colIndex);
          });
          const add = document.createElement("select");
          add.setAttribute("aria-label", `Añadir bloque a la columna ${String(colIndex + 1)}`);
          const placeholderOpt = document.createElement("option");
          placeholderOpt.value = "";
          placeholderOpt.textContent = "Añadir bloque…";
          add.appendChild(placeholderOpt);
          for (const meta of getRegisteredBlocks()) {
            if (!isBlockType(meta.type)) continue;
            const type: BlockType = meta.type;
            const opt = document.createElement("option");
            opt.value = type;
            opt.textContent = meta.label;
            add.appendChild(opt);
          }
          add.addEventListener("change", () => {
            if (!isBlockType(add.value)) return;
            const type: BlockType = add.value;
            const host = liveColumns(block.id);
            if (host === undefined || host.type !== "columns") return;
            const next = cloneColumns(host.columns);
            const dest = next[colIndex];
            if (dest === undefined) return;
            dest.blocks = [...dest.blocks, createBlockData(type, createId())];
            writeColumns(block.id, next);
            announce(liveEl, "Bloque añadido a la columna.");
          });
          colBox.append(colTitle, ul, add);
          colsWrap.appendChild(colBox);
        });
        const colsRow = el("div", "block__inline");
        const addCol = document.createElement("button");
        addCol.type = "button";
        addCol.className = "block__btn-text";
        addCol.textContent = "Añadir columna";
        addCol.disabled = block.columns.length >= 3;
        addCol.addEventListener("click", () => {
          const host = liveColumns(block.id);
          if (host === undefined || host.type !== "columns") return;
          if (host.columns.length >= 3) return;
          writeColumns(block.id, [...cloneColumns(host.columns), { blocks: [] }]);
          announce(liveEl, "Columna añadida.");
        });
        const delCol = document.createElement("button");
        delCol.type = "button";
        delCol.className = "block__btn-text";
        delCol.textContent = "Quitar columna";
        delCol.disabled = block.columns.length <= 2;
        delCol.addEventListener("click", () => {
          const host = liveColumns(block.id);
          if (host === undefined || host.type !== "columns") return;
          if (host.columns.length <= 2) return;
          writeColumns(block.id, cloneColumns(host.columns).slice(0, -1));
          announce(liveEl, "Columna quitada.");
        });
        colsRow.append(addCol, delCol);
        wrap.append(colsWrap, colsRow);
        break;
      }
      case "table": {
        const headerBox = document.createElement("input");
        headerBox.type = "checkbox";
        headerBox.checked = block.headerRow;
        headerBox.addEventListener("change", () => {
          store.update(block.id, { headerRow: headerBox.checked });
        });
        const headerRow = el("div", "block__inline");
        headerRow.appendChild(inlinePair("Fila de cabecera", headerBox, `${block.id}-headerrow`));
        const headers = document.createElement("input");
        headers.type = "text";
        headers.value = block.headers.join(" | ");
        headers.placeholder = "Nombre | Precio";
        headers.setAttribute("aria-label", "Cabeceras separadas por |");
        headers.addEventListener("input", () => {
          store.update(block.id, {
            headers: headers.value.split("|").slice(0, 6).map((v) => sanitizeText(v).slice(0, 200)),
          });
        });
        const rows = document.createElement("textarea");
        rows.rows = 4;
        rows.value = block.rows.map((r) => r.join(" | ")).join("\n");
        rows.placeholder = "Una fila por línea, celdas con |";
        rows.setAttribute("aria-label", "Filas de la tabla, una por línea");
        rows.addEventListener("input", () => {
          store.update(block.id, {
            rows: rows.value
              .split("\n")
              .slice(0, 20)
              .map((line) => line.split("|").slice(0, 6).map((v) => sanitizeText(v).slice(0, 200))),
          });
        });
        wrap.append(
          headerRow,
          labelFor("Cabeceras", headers, `${block.id}-headers`),
          headers,
          labelFor("Filas", rows, `${block.id}-rows`),
          rows,
        );
        break;
      }
    }
    return wrap;
  }
}
