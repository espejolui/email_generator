import { Block } from "../core/decorators/Block.js";
import { StyledBlock } from "./StyledBlock.js";
import { Editable } from "../core/decorators/Editable.js";
import { sanitizeMargin } from "../core/sanitize/sanitize.js";
import type { SpacerBlockData } from "./types.js";

@Block({ type: "spacer", label: "Espaciador", icon: "move-vertical" })
export class SpacerBlock extends StyledBlock {
  #height = 16;

  @Editable()
  set height(value: string) {
    this.#height = sanitizeMargin(value);
  }

  get height(): number {
    return this.#height;
  }

  toData(): SpacerBlockData {
    return { ...this.appearanceData(), id: this.id, type: "spacer", height: this.#height };
  }
}
