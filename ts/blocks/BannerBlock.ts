import { Block } from "../core/decorators/Block.js";
import { StyledBlock } from "./StyledBlock.js";
import { Editable } from "../core/decorators/Editable.js";
import {
  sanitizeAlt,
  sanitizeHttpsUrl,
  sanitizeImageSrc,
  sanitizeText,
} from "../core/sanitize/sanitize.js";
import type { BannerBlockData } from "./types.js";

@Block({ type: "banner", label: "Video / banner", icon: "play" })
export class BannerBlock extends StyledBlock {
  #src = "";
  #alt = "";
  #href = "";
  #caption = "";

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
  set href(value: string) {
    this.#href = sanitizeHttpsUrl(value);
  }

  get href(): string {
    return this.#href;
  }

  @Editable()
  set caption(value: string) {
    this.#caption = sanitizeText(value).slice(0, 120);
  }

  get caption(): string {
    return this.#caption;
  }

  toData(): BannerBlockData {
    return {
      ...this.appearanceData(),
      id: this.id,
      type: "banner",
      src: this.#src,
      alt: this.#alt,
      href: this.#href,
      caption: this.#caption,
    };
  }
}
