import { Block } from "../core/decorators/Block.js";
import { Editable } from "../core/decorators/Editable.js";
import { sanitizeColor, sanitizeMargin } from "../core/sanitize/sanitize.js";
import type { DividerBlockData } from "./types.js";

@Block({ type: "divider", label: "Separador", icon: "minus" })
export class DividerBlock {
  readonly id: string;
  #color = "";
  #marginTop = 8;
  #marginBottom = 8;

  constructor(id: string) {
    this.id = id;
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

  toData(): DividerBlockData {
    return {
      id: this.id,
      type: "divider",
      color: this.#color,
      marginTop: this.#marginTop,
      marginBottom: this.#marginBottom,
    };
  }
}
