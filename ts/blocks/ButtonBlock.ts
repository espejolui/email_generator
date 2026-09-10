import { Block } from "../core/decorators/Block.js";
import { Editable } from "../core/decorators/Editable.js";
import { sanitizeHref, sanitizeText } from "../core/sanitize/sanitize.js";
import type { ButtonBlockData, ButtonColor } from "./types.js";
import { isButtonColor } from "./types.js";

@Block({ type: "button", label: "Botón", icon: "🔘" })
export class ButtonBlock {
  readonly id: string;
  #label = "";
  #href = "";
  #color: ButtonColor = "green";

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
  set href(value: string) {
    this.#href = sanitizeHref(value);
  }

  get href(): string {
    return this.#href;
  }

  @Editable()
  set color(value: string) {
    this.#color = isButtonColor(value) ? value : "green";
  }

  get color(): ButtonColor {
    return this.#color;
  }

  toData(): ButtonBlockData {
    return { id: this.id, type: "button", label: this.#label, href: this.#href, color: this.#color };
  }
}
