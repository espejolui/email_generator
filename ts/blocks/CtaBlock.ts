import { Block } from "../core/decorators/Block.js";
import { StyledBlock } from "./StyledBlock.js";
import { Editable } from "../core/decorators/Editable.js";
import { sanitizeHttpsUrl, sanitizeMargin, sanitizeText } from "../core/sanitize/sanitize.js";
import type { ButtonAlign, CtaBlockData } from "./types.js";
import { isButtonAlign } from "./types.js";

@Block({ type: "cta", label: "Botón enlace", icon: "link" })
export class CtaBlock extends StyledBlock {
  #label = "";
  #url = "";
  #align: ButtonAlign = "center";
  #marginTop = 0;
  #marginBottom = 0;

  constructor(id: string) {
    super(id, "#41b6e6");
  }

  @Editable()
  set label(value: string) {
    this.#label = sanitizeText(value).slice(0, 80);
  }

  get label(): string {
    return this.#label;
  }

  @Editable()
  set url(value: string) {
    this.#url = sanitizeHttpsUrl(value);
  }

  get url(): string {
    return this.#url;
  }

  @Editable()
  set align(value: string) {
    this.#align = isButtonAlign(value) ? value : "center";
  }

  get align(): ButtonAlign {
    return this.#align;
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

  toData(): CtaBlockData {
    return {
      ...this.appearanceData(),
      id: this.id,
      type: "cta",
      label: this.#label,
      url: this.#url,
      align: this.#align,
      marginTop: this.#marginTop,
      marginBottom: this.#marginBottom,
    };
  }
}
