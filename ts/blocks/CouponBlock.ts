import { Block } from "../core/decorators/Block.js";
import { Editable } from "../core/decorators/Editable.js";
import { sanitizeText } from "../core/sanitize/sanitize.js";
import type { CouponBlockData } from "./types.js";

@Block({ type: "coupon", label: "Cupón", icon: "ticket" })
export class CouponBlock {
  readonly id: string;
  #code = "";
  #description = "";

  constructor(id: string) {
    this.id = id;
  }

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
      id: this.id,
      type: "coupon",
      code: this.#code,
      description: this.#description,
    };
  }
}
