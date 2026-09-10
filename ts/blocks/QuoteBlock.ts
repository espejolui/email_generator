import { Block } from "../core/decorators/Block.js";
import { Editable } from "../core/decorators/Editable.js";
import { sanitizeText } from "../core/sanitize/sanitize.js";
import type { QuoteBlockData } from "./types.js";

@Block({ type: "quote", label: "Cita", icon: "💬" })
export class QuoteBlock {
  readonly id: string;
  #content = "";
  #cite = "";

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

  toData(): QuoteBlockData {
    return { id: this.id, type: "quote", content: this.#content, cite: this.#cite };
  }
}
