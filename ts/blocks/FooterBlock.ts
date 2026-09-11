import { Block } from "../core/decorators/Block.js";
import { Editable } from "../core/decorators/Editable.js";
import { sanitizeHttpsUrl, sanitizeText } from "../core/sanitize/sanitize.js";
import type { FooterBlockData, SocialUrls } from "./types.js";

const EMPTY_SOCIAL: SocialUrls = { instagram: "", facebook: "", x: "", linkedin: "" };

@Block({ type: "footer", label: "Pie de página", icon: "panel-bottom" })
export class FooterBlock {
  readonly id: string;
  #address = "";
  #unsubscribeUrl = "";
  #social: SocialUrls = { ...EMPTY_SOCIAL };

  constructor(id: string) {
    this.id = id;
  }

  @Editable()
  set address(value: string) {
    this.#address = sanitizeText(value).slice(0, 500);
  }

  get address(): string {
    return this.#address;
  }

  @Editable()
  set unsubscribeUrl(value: string) {
    this.#unsubscribeUrl = sanitizeHttpsUrl(value);
  }

  get unsubscribeUrl(): string {
    return this.#unsubscribeUrl;
  }

  @Editable()
  set social(values: SocialUrls) {
    this.#social = {
      instagram: sanitizeHttpsUrl(values.instagram),
      facebook: sanitizeHttpsUrl(values.facebook),
      x: sanitizeHttpsUrl(values.x),
      linkedin: sanitizeHttpsUrl(values.linkedin),
    };
  }

  get social(): SocialUrls {
    return { ...this.#social };
  }

  toData(): FooterBlockData {
    return {
      id: this.id,
      type: "footer",
      address: this.#address,
      unsubscribeUrl: this.#unsubscribeUrl,
      social: { ...this.#social },
    };
  }
}
