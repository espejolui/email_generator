import { Block } from "../core/decorators/Block.js";
import { Editable } from "../core/decorators/Editable.js";
import { sanitizeColor, sanitizeMargin, sanitizeText } from "../core/sanitize/sanitize.js";
import type { QuoteBlockData, TextAlign } from "./types.js";
import { isTextAlign } from "./types.js";

@Block({ type: "quote", label: "Cita", icon: "quote" })
export class QuoteBlock {
  readonly id: string;
  #content = "";
  #cite = "";
  #align: TextAlign = "left";
  #bg = "";
  #color = "";
  #bold = false;
  #italic = false;
  #underline = false;
  #strike = false;
  #borderRadius = 0;

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
  set bold(value: boolean) {
    this.#bold = value;
  }

  get bold(): boolean {
    return this.#bold;
  }

  @Editable()
  set italic(value: boolean) {
    this.#italic = value;
  }

  get italic(): boolean {
    return this.#italic;
  }

  @Editable()
  set underline(value: boolean) {
    this.#underline = value;
  }

  get underline(): boolean {
    return this.#underline;
  }

  @Editable()
  set strike(value: boolean) {
    this.#strike = value;
  }

  get strike(): boolean {
    return this.#strike;
  }

  @Editable()
  set borderRadius(value: string) {
    this.#borderRadius = sanitizeMargin(value);
  }

  get borderRadius(): number {
    return this.#borderRadius;
  }

  toData(): QuoteBlockData {
    return {
      id: this.id,
      type: "quote",
      content: this.#content,
      cite: this.#cite,
      align: this.#align,
      bg: this.#bg,
      color: this.#color,
      bold: this.#bold,
      italic: this.#italic,
      underline: this.#underline,
      strike: this.#strike,
      borderRadius: this.#borderRadius,
    };
  }
}
