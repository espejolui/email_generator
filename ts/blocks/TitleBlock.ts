import { Block } from "../core/decorators/Block.js";
import { Editable } from "../core/decorators/Editable.js";
import { sanitizeText } from "../core/sanitize/sanitize.js";
import type { TitleBlockData } from "./types.js";

@Block({ type: "title", label: "Título", icon: "🔠" })
export class TitleBlock {
  readonly id: string;
  #content = "";
  #level: 1 | 2 | 3 = 2;

  constructor(id: string) {
    this.id = id;
  }

  @Editable()
  set content(value: string) {
    this.#content = sanitizeText(value).slice(0, 300);
  }

  get content(): string {
    return this.#content;
  }

  @Editable()
  set level(value: number) {
    this.#level = value === 1 ? 1 : value === 3 ? 3 : 2;
  }

  get level(): 1 | 2 | 3 {
    return this.#level;
  }

  toData(): TitleBlockData {
    return { id: this.id, type: "title", content: this.#content, level: this.#level };
  }
}
