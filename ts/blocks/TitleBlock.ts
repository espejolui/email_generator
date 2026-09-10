import { Block } from "../core/decorators/Block.js";
import { Editable } from "../core/decorators/Editable.js";
import { sanitizeColor, sanitizeMargin, sanitizeText } from "../core/sanitize/sanitize.js";
import type { TextAlign, TitleBlockData, TitleLevel } from "./types.js";
import { isTextAlign, isTitleLevel } from "./types.js";

@Block({ type: "title", label: "Título", icon: "heading" })
export class TitleBlock {
  readonly id: string;
  #content = "";
  #level: TitleLevel = 1;
  #align: TextAlign = "left";
  #bg = "";
  #color = "";
  #marginTop = 0;
  #marginBottom = 12;
  #bold = false;
  #italic = false;
  #underline = false;
  #strike = false;

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
    this.#level = isTitleLevel(value) ? value : 1;
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

  toData(): TitleBlockData {
    return {
      id: this.id,
      type: "title",
      content: this.#content,
      level: this.#level,
      align: this.#align,
      bg: this.#bg,
      color: this.#color,
      marginTop: this.#marginTop,
      marginBottom: this.#marginBottom,
      bold: this.#bold,
      italic: this.#italic,
      underline: this.#underline,
      strike: this.#strike,
    };
  }
}
