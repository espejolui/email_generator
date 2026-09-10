import { Block } from "../core/decorators/Block.js";
import { Editable } from "../core/decorators/Editable.js";
import { sanitizeText } from "../core/sanitize/sanitize.js";
import type { TextBlockData } from "./types.js";

@Block({ type: "text", label: "Caja de texto", icon: "📝" })
export class TextBlock {
  readonly id: string;
  #content = "";

  constructor(id: string) {
    this.id = id;
  }

  @Editable()
  set content(value: string) {
    this.#content = sanitizeText(value).slice(0, 2000);
  }

  get content(): string {
    return this.#content;
  }

  toData(): TextBlockData {
    return { id: this.id, type: "text", content: this.#content };
  }
}
