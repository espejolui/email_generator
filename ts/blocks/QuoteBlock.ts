import { Block } from "../core/decorators/Block.js";
import { Editable } from "../core/decorators/Editable.js";
import { sanitizeText } from "../core/sanitize/sanitize.js";
import type { QuoteBlockData, TextAlign } from "./types.js";
import { isTextAlign } from "./types.js";

@Block({ type: "quote", label: "Cita", icon: "quote" })
export class QuoteBlock {
  readonly id: string;
  #content = "";
  #cite = "";
  #align: TextAlign = "left";

  constructor(id: string) {
    this.id = id;
  }

  @Editable()
  set content(value: string) {
    this.#content = sanitizeText(value).slice(0, 1000);
  }

  get content(): string {
    return this.#content;
  }

  @Editable()
  set cite(value: string) {
    this.#cite = sanitizeText(value).slice(0, 200);
  }

  get cite(): string {
    return this.#cite;
  }

  @Editable()
  set align(value: string) {
    this.#align = isTextAlign(value) ? value : "left";
  }

  get align(): TextAlign {
    return this.#align;
  }

  toData(): QuoteBlockData {
    return { id: this.id, type: "quote", content: this.#content, cite: this.#cite, align: this.#align };
  }
}
