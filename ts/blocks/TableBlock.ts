import { Block } from "../core/decorators/Block.js";
import { Editable } from "../core/decorators/Editable.js";
import { sanitizeText } from "../core/sanitize/sanitize.js";
import type { TableBlockData } from "./types.js";

const MAX_COLS = 6;
const MAX_ROWS = 20;
const MAX_CELL = 200;

function sanitizeRow(cells: readonly string[]): string[] {
  return cells.slice(0, MAX_COLS).map((cell) => sanitizeText(cell).slice(0, MAX_CELL));
}

@Block({ type: "table", label: "Tabla de datos", icon: "table" })
export class TableBlock {
  readonly id: string;
  #headers: string[] = [];
  #rows: string[][] = [];
  #headerRow = true;

  constructor(id: string) {
    this.id = id;
  }

  @Editable()
  set headers(values: readonly string[]) {
    this.#headers = sanitizeRow(values);
  }

  get headers(): readonly string[] {
    return [...this.#headers];
  }

  @Editable()
  set rows(values: readonly (readonly string[])[]) {
    this.#rows = values.slice(0, MAX_ROWS).map(sanitizeRow);
  }

  get rows(): readonly (readonly string[])[] {
    return this.#rows.map((row) => [...row]);
  }

  @Editable()
  set headerRow(value: boolean) {
    this.#headerRow = value;
  }

  get headerRow(): boolean {
    return this.#headerRow;
  }

  toData(): TableBlockData {
    return {
      id: this.id,
      type: "table",
      headers: [...this.#headers],
      rows: this.#rows.map((row) => [...row]),
      headerRow: this.#headerRow,
    };
  }
}
