import { Block } from "../core/decorators/Block.js";
import { StyledBlock } from "./StyledBlock.js";
import { Editable } from "../core/decorators/Editable.js";
import { sanitizeAlt, sanitizeImageSrc } from "../core/sanitize/sanitize.js";
import type { ImageBlockData } from "./types.js";

@Block({ type: "image", label: "Imagen", icon: "image" })
export class ImageBlock extends StyledBlock {
  #src = "";
  #alt = "";

  @Editable()
  set src(value: string) {
    this.#src = sanitizeImageSrc(value);
  }

  get src(): string {
    return this.#src;
  }

  @Editable()
  set alt(value: string) {
    this.#alt = sanitizeAlt(value);
  }

  get alt(): string {
    return this.#alt;
  }

  toData(): ImageBlockData {
    return { ...this.appearanceData(), id: this.id, type: "image", src: this.#src, alt: this.#alt };
  }
}
