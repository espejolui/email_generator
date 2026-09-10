import { Block } from "../core/decorators/Block.js";
import { Editable } from "../core/decorators/Editable.js";
import { sanitizeColor, sanitizeText } from "../core/sanitize/sanitize.js";
import type { TextAlign, TitleBlockData, TitleLevel } from "./types.js";
import { isTextAlign, isTitleLevel } from "./types.js";

@Block({ type: "title", label: "Título", icon: "🔠" })
export class TitleBlock {
  readonly id: string;
  #content = "";
  #level: TitleLevel = 2;
  #align: TextAlign = "left";
  #bg = "";

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
  set level(value: unknown) {
    this.#level = isTitleLevel(value) ? value : 2;
  }

  get level(): TitleLevel {
    return this.#level;
  }

  @Editable()
  set align(value: string) {
    this.#align = isTextAlign(value) ? value : "left";
  }

  get align(): TextAlign {
    return this.#align;
  }

  @Editable()
  set bg(value: string) {
    this.#bg = sanitizeColor(value);
  }

  get bg(): string {
    return this.#bg;
  }

  toData(): TitleBlockData {
    return {
      id: this.id,
      type: "title",
      content: this.#content,
      level: this.#level,
      align: this.#align,
      bg: this.#bg,
    };
  }
}
