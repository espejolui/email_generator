import { Block } from "../core/decorators/Block.js";
import { Editable } from "../core/decorators/Editable.js";
import { sanitizeHttpsUrl, sanitizeMargin, sanitizeText } from "../core/sanitize/sanitize.js";
import type { ButtonAlign, ButtonColor, CtaBlockData } from "./types.js";
import { isButtonAlign, isButtonColor } from "./types.js";

@Block({ type: "cta", label: "Botón enlace", icon: "link" })
export class CtaBlock {
  readonly id: string;
  #label = "";
  #url = "";
  #color: ButtonColor = "blue";
  #align: ButtonAlign = "center";
  #marginTop = 0;
  #marginBottom = 0;

  constructor(id: string) {
    this.id = id;
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
  set color(value: string) {
    this.#color = isButtonColor(value) ? value : "blue";
  }

  get color(): ButtonColor {
    return this.#color;
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
      id: this.id,
      type: "cta",
      label: this.#label,
      url: this.#url,
      color: this.#color,
      align: this.#align,
      marginTop: this.#marginTop,
      marginBottom: this.#marginBottom,
    };
  }
}
