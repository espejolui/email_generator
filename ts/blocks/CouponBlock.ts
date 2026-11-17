import { Block } from "../core/decorators/Block.js";
import { StyledBlock } from "./StyledBlock.js";
import { Editable } from "../core/decorators/Editable.js";
import { sanitizeFontSize, sanitizeMargin, sanitizeText } from "../core/sanitize/sanitize.js";
import type { CouponBlockData } from "./types.js";

@Block({ type: "coupon", label: "Cupón", icon: "ticket" })
export class CouponBlock extends StyledBlock {
  #code = "";
  #description = "";
  #marginTop = 0;
  #marginBottom = 0;
  #fontSize = 0;

  @Editable()
  set code(value: string) {
    this.#code = sanitizeText(value).slice(0, 40);
  }

  get code(): string {
    return this.#code;
  }

  @Editable()
  set description(value: string) {
    this.#description = sanitizeText(value).slice(0, 200);
  }

  get description(): string {
    return this.#description;
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

  toData(): CouponBlockData {
    return {
      ...this.appearanceData(),
      id: this.id,
      type: "coupon",
      code: this.#code,
      description: this.#description,
      marginTop: this.#marginTop,
      marginBottom: this.#marginBottom,
      fontSize: this.#fontSize,
    };
  }
}
