import { Block } from "../core/decorators/Block.js";
import { StyledBlock } from "./StyledBlock.js";
import { Editable } from "../core/decorators/Editable.js";
import { sanitizeMargin } from "../core/sanitize/sanitize.js";
import type { DividerBlockData } from "./types.js";

@Block({ type: "divider", label: "Separador", icon: "minus" })
export class DividerBlock extends StyledBlock {
  #marginTop = 8;
  #marginBottom = 8;
  #thickness = 2;

  constructor(id: string) {
    super(id, "", 2);
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
  set thickness(value: string) {
    this.#thickness = sanitizeMargin(value);
  }

  get thickness(): number {
    return this.#thickness;
  }

  toData(): DividerBlockData {
    return {
      ...this.appearanceData(),
      id: this.id,
      type: "divider",
      marginTop: this.#marginTop,
      marginBottom: this.#marginBottom,
      thickness: this.#thickness,
    };
  }
}
