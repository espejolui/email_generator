import { Block } from "../core/decorators/Block.js";
import { Editable } from "../core/decorators/Editable.js";
import { sanitizeColor, sanitizeMargin, sanitizeText } from "../core/sanitize/sanitize.js";
import type { TextAlign, TextBlockData } from "./types.js";
import { isTextAlign } from "./types.js";

@Block({ type: "text", label: "Caja de texto", icon: "text" })
export class TextBlock {
  readonly id: string;
  #content = "";
  #align: TextAlign = "left";
  #bg = "";
  #color = "";
  #marginTop = 0;
  #marginBottom = 0;

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

  @Editable()
  set color(value: string) {
    this.#color = sanitizeColor(value);
  }

  get color(): string {
    return this.#color;
  }

  @Editable()
  set marginTop(value: string) {
    this.#marginTop = sanitizeMargin(value);
  }

  get marginTop(): number {
    return this.#marginTop;
  }

  @Editable()
  set marginBottom(value: string) {
    this.#marginBottom = sanitizeMargin(value);
  }

  get marginBottom(): number {
    return this.#marginBottom;
  }

  toData(): TextBlockData {
    return {
      id: this.id,
      type: "text",
      content: this.#content,
      align: this.#align,
      bg: this.#bg,
      color: this.#color,
      marginTop: this.#marginTop,
      marginBottom: this.#marginBottom,
    };
  }
}
