import { Block } from "../core/decorators/Block.js";
import { StyledBlock } from "./StyledBlock.js";
import { Editable } from "../core/decorators/Editable.js";
import {
  sanitizeAlt,
  sanitizeHttpsUrl,
  sanitizeImageSrc,
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
    };
  }
}
