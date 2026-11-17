import { Block } from "../core/decorators/Block.js";
import { StyledBlock } from "./StyledBlock.js";
import { Editable } from "../core/decorators/Editable.js";
import { sanitizeFontSize, sanitizeMargin, sanitizeText } from "../core/sanitize/sanitize.js";
import type { ListBlockData, TextAlign } from "./types.js";
import { isTextAlign } from "./types.js";

@Block({ type: "list", label: "Lista", icon: "list" })
export class ListBlock extends StyledBlock {
  #items: string[] = [""];
  #ordered = false;
  #align: TextAlign = "left";
  #marginTop = 0;
  #marginBottom = 0;
  #fontSize = 0;

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
  set fontSize(value: string) {
    this.#fontSize = sanitizeFontSize(value);
  }

  get fontSize(): number {
    return this.#fontSize;
  }

  toData(): ListBlockData {
    return {
      ...this.appearanceData(),
      id: this.id,
      type: "list",
      items: [...this.#items],
      ordered: this.#ordered,
      align: this.#align,
      marginTop: this.#marginTop,
      marginBottom: this.#marginBottom,
      fontSize: this.#fontSize,
    };
  }
}
