import { Block } from "../core/decorators/Block.js";
import { StyledBlock } from "./StyledBlock.js";
import { Editable } from "../core/decorators/Editable.js";
import {
  sanitizeAlt,
  sanitizeFontSize,
  sanitizeHttpsUrl,
  sanitizeImageSrc,
  sanitizeImageWidth,
  sanitizeMargin,
  sanitizeText,
} from "../core/sanitize/sanitize.js";
import type { BannerBlockData } from "./types.js";

@Block({ type: "banner", label: "Video / banner", icon: "play" })
export class BannerBlock extends StyledBlock {
  #src = "";
  #alt = "";
  #href = "";
  #caption = "";
  #marginTop = 0;
  #marginBottom = 0;
  #fontSize = 0;
  #width = 504;

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

  @Editable()
  set width(value: string) {
    this.#width = sanitizeImageWidth(value);
  }

  get width(): number {
    return this.#width;
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
      marginTop: this.#marginTop,
      marginBottom: this.#marginBottom,
      fontSize: this.#fontSize,
      width: this.#width,
    };
  }
}
