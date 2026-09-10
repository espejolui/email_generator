import { Block } from "../core/decorators/Block.js";
import { Editable } from "../core/decorators/Editable.js";
import { sanitizePhone, sanitizeText } from "../core/sanitize/sanitize.js";
import type { ButtonAlign, ButtonBlockData, ButtonColor } from "./types.js";
import { isButtonAlign, isButtonColor } from "./types.js";

@Block({ type: "button", label: "Botón WhatsApp", icon: "message-circle" })
export class ButtonBlock {
  readonly id: string;
  #label = "";
  #phone = "";
  #message = "";
  #color: ButtonColor = "green";
  #align: ButtonAlign = "center";

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
  set phone(value: string) {
    this.#phone = sanitizePhone(value);
  }

  get phone(): string {
    return this.#phone;
  }

  @Editable()
  set message(value: string) {
    // En crudo (recorte + tope): se codifica para URL al renderizar, nunca toca HTML.
    this.#message = value.trim().slice(0, 300);
  }

  get message(): string {
    return this.#message;
  }

  @Editable()
  set color(value: string) {
    this.#color = isButtonColor(value) ? value : "green";
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

  toData(): ButtonBlockData {
    return {
      id: this.id,
      type: "button",
      label: this.#label,
      phone: this.#phone,
      message: this.#message,
      color: this.#color,
      align: this.#align,
    };
  }
}
