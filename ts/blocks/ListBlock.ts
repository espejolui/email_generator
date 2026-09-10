import { Block } from "../core/decorators/Block.js";
import { Editable } from "../core/decorators/Editable.js";
import { sanitizeText } from "../core/sanitize/sanitize.js";
import type { ListBlockData, TextAlign } from "./types.js";
import { isTextAlign } from "./types.js";

@Block({ type: "list", label: "Lista", icon: "📋" })
export class ListBlock {
  readonly id: string;
  #items: string[] = [""];
  #ordered = false;
  #align: TextAlign = "left";

  constructor(id: string) {
    this.id = id;
  }

  @Editable()
  set items(values: readonly string[]) {
    this.#items = values.slice(0, 20).map((v) => sanitizeText(v).slice(0, 300));
    if (this.#items.length === 0) this.#items = [""];
  }

  get items(): readonly string[] {
    return [...this.#items];
  }

  @Editable()
  set ordered(value: boolean) {
    this.#ordered = value;
  }

  get ordered(): boolean {
    return this.#ordered;
  }

  @Editable()
  set align(value: string) {
    this.#align = isTextAlign(value) ? value : "left";
  }

  get align(): TextAlign {
    return this.#align;
  }

  toData(): ListBlockData {
    return { id: this.id, type: "list", items: [...this.#items], ordered: this.#ordered, align: this.#align };
  }
}
