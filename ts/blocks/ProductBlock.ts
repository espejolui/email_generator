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
import type { ProductBlockData } from "./types.js";

@Block({ type: "product", label: "Producto", icon: "shopping-bag" })
export class ProductBlock extends StyledBlock {
  #src = "";
  #alt = "";
  #name = "";
  #price = "";
  #url = "";
  #buttonLabel = "";
  #marginTop = 0;
  #marginBottom = 0;
  #fontSize = 0;
  #imgWidth = 220;

  constructor(id: string) {
    super(id, "#41b6e6");
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
  set name(value: string) {
    this.#name = sanitizeText(value).slice(0, 120);
  }

  get name(): string {
    return this.#name;
  }

  @Editable()
  set price(value: string) {
    this.#price = sanitizeText(value).slice(0, 40);
  }

  get price(): string {
    return this.#price;
  }

  @Editable()
  set url(value: string) {
    this.#url = sanitizeHttpsUrl(value);
  }

  get url(): string {
    return this.#url;
  }

  @Editable()
  set buttonLabel(value: string) {
    this.#buttonLabel = sanitizeText(value).slice(0, 40);
  }

  get buttonLabel(): string {
    return this.#buttonLabel;
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
  set imgWidth(value: string) {
    this.#imgWidth = sanitizeImageWidth(value);
  }

  get imgWidth(): number {
    return this.#imgWidth;
  }

  toData(): ProductBlockData {
    return {
      ...this.appearanceData(),
      id: this.id,
      type: "product",
      src: this.#src,
      alt: this.#alt,
      name: this.#name,
      price: this.#price,
      url: this.#url,
      buttonLabel: this.#buttonLabel,
      marginTop: this.#marginTop,
      marginBottom: this.#marginBottom,
      fontSize: this.#fontSize,
      imgWidth: this.#imgWidth,
    };
  }
}
