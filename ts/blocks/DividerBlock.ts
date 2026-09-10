import { Block } from "../core/decorators/Block.js";
import type { DividerBlockData } from "./types.js";

@Block({ type: "divider", label: "Separador", icon: "➖" })
export class DividerBlock {
  readonly id: string;

  constructor(id: string) {
    this.id = id;
  }

  toData(): DividerBlockData {
    return { id: this.id, type: "divider" };
  }
}
