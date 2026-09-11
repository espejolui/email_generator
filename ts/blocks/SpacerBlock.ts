import { Block } from "../core/decorators/Block.js";
import { Editable } from "../core/decorators/Editable.js";
import { sanitizeMargin } from "../core/sanitize/sanitize.js";
import type { SpacerBlockData } from "./types.js";

@Block({ type: "spacer", label: "Espaciador", icon: "move-vertical" })
export class SpacerBlock {
  readonly id: string;
  #height = 16;

  constructor(id: string) {
    this.id = id;
  }

  @Editable()
  set height(value: string) {
    this.#height = sanitizeMargin(value);
  }

  get height(): number {
    return this.#height;
  }

  toData(): SpacerBlockData {
    return { id: this.id, type: "spacer", height: this.#height };
  }
}
