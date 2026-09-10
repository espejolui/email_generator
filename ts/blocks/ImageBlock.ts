import { Block } from "../core/decorators/Block.js";
import { Editable } from "../core/decorators/Editable.js";
import {
  sanitizeAlt,
  sanitizeImageSrc,
  sanitizeText,
} from "../core/sanitize/sanitize.js";
import type { ImageBlockData, TextAlign } from "./types.js";
import { isTextAlign } from "./types.js";

@Block({ type: "image", label: "Imagen", icon: "🖼️" })
export class ImageBlock {
  readonly id: string;
  #src = "";
  #alt = "";
  #caption = "";
  #captionAlign: TextAlign = "left";

  constructor(id: string) {
    this.id = id;
  }

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

  @Editable()
  set caption(value: string) {
    this.#caption = sanitizeText(value).slice(0, 300);
  }

  get caption(): string {
    return this.#caption;
  }

  @Editable()
  set captionAlign(value: string) {
    this.#captionAlign = isTextAlign(value) ? value : "left";
  }

  get captionAlign(): TextAlign {
    return this.#captionAlign;
  }

  toData(): ImageBlockData {
    return {
      id: this.id,
      type: "image",
      src: this.#src,
      alt: this.#alt,
      caption: this.#caption,
      captionAlign: this.#captionAlign,
    };
  }
}
