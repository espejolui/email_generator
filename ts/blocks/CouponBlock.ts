import { Block } from "../core/decorators/Block.js";
import { StyledBlock } from "./StyledBlock.js";
import { Editable } from "../core/decorators/Editable.js";
import { sanitizeText } from "../core/sanitize/sanitize.js";
import type { CouponBlockData } from "./types.js";

@Block({ type: "coupon", label: "Cupón", icon: "ticket" })
export class CouponBlock extends StyledBlock {
  #code = "";
  #description = "";

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

  toData(): CouponBlockData {
    return {
      ...this.appearanceData(),
      id: this.id,
      type: "coupon",
      code: this.#code,
      description: this.#description,
    };
  }
}
