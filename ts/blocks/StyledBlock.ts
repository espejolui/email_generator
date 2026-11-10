import { Editable } from "../core/decorators/Editable.js";
import { sanitizeColor, sanitizeMargin } from "../core/sanitize/sanitize.js";
import type { BlockAppearance, BorderStyle } from "./types.js";
import { isBorderStyle } from "./types.js";

export abstract class StyledBlock {
  readonly id: string;
  #bg = "";
  #color: string;
  #borderColor = "";
  #borderWidth = 0;
  #borderStyle: BorderStyle = "solid";
  #borderRadius: number;

  constructor(id: string, defaultColor = "", defaultRadius = 0) {
    this.id = id;
    this.#color = defaultColor;
    this.#borderRadius = defaultRadius;
  }

  @Editable()
  set bg(value: string) {
    this.#bg = sanitizeColor(value);
  }

  get bg(): string {
    return this.#bg;
  }

  @Editable()
  set color(value: string) {
    this.#color = sanitizeColor(value);
  }

  get color(): string {
    return this.#color;
  }

  @Editable()
  set borderColor(value: string) {
    this.#borderColor = sanitizeColor(value);
  }

  get borderColor(): string {
    return this.#borderColor;
  }

  @Editable()
  set borderWidth(value: string) {
    this.#borderWidth = sanitizeMargin(value);
  }

  get borderWidth(): number {
    return this.#borderWidth;
  }

  @Editable()
  set borderStyle(value: string) {
    this.#borderStyle = isBorderStyle(value) ? value : "solid";
  }

  get borderStyle(): BorderStyle {
    return this.#borderStyle;
  }

  @Editable()
  set borderRadius(value: string) {
    this.#borderRadius = sanitizeMargin(value);
  }

  get borderRadius(): number {
    return this.#borderRadius;
  }

  protected appearanceData(): BlockAppearance {
    return {
      bg: this.#bg,
      color: this.#color,
      borderColor: this.#borderColor,
      borderWidth: this.#borderWidth,
      borderStyle: this.#borderStyle,
      borderRadius: this.#borderRadius,
    };
  }
}
