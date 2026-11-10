import { Block } from "../core/decorators/Block.js";
import { StyledBlock } from "./StyledBlock.js";
import { Editable } from "../core/decorators/Editable.js";
import type { ColumnData, ColumnsBlockData } from "./types.js";

function sanitizeColumn(column: ColumnData): ColumnData {
  return { blocks: column.blocks };
}

@Block({ type: "columns", label: "Columnas", icon: "columns-2" })
export class ColumnsBlock extends StyledBlock {
  #columns: ColumnData[] = [{ blocks: [] }, { blocks: [] }];

  /**
   * Columnas completas (2–3). Los bloques internos ya vienen sanitizados
   * (Canvas sanitiza al editar); aquí solo se fija el rango 2–3.
   */
  @Editable()
  set columns(values: readonly ColumnData[]) {
    const next = values.slice(0, 3).map(sanitizeColumn);
    while (next.length < 2) next.push({ blocks: [] });
    this.#columns = next;
  }

  get columns(): readonly ColumnData[] {
    return this.#columns.map((col) => ({ blocks: [...col.blocks] }));
  }

  toData(): ColumnsBlockData {
    return {
      ...this.appearanceData(),
      id: this.id,
      type: "columns",
      columns: this.#columns.map((col) => ({ blocks: [...col.blocks] })),
    };
  }
}
