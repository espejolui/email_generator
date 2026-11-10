import { Block } from "../core/decorators/Block.js";
import { StyledBlock } from "./StyledBlock.js";
import { Editable } from "../core/decorators/Editable.js";
import { sanitizeHttpsUrl, sanitizeText } from "../core/sanitize/sanitize.js";
import type { FooterBlockData, SocialUrls } from "./types.js";

const EMPTY_SOCIAL: SocialUrls = { instagram: "", facebook: "", x: "", linkedin: "" };

@Block({ type: "footer", label: "Pie de página", icon: "panel-bottom" })
export class FooterBlock extends StyledBlock {
  #address = "";
  #unsubscribeUrl = "";
  #social: SocialUrls = { ...EMPTY_SOCIAL };

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
      ...this.appearanceData(),
      id: this.id,
      type: "footer",
      address: this.#address,
      unsubscribeUrl: this.#unsubscribeUrl,
      social: { ...this.#social },
    };
  }
}
