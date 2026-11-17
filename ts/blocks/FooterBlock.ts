import { Block } from "../core/decorators/Block.js";
import { StyledBlock } from "./StyledBlock.js";
import { Editable } from "../core/decorators/Editable.js";
import { sanitizeFontSize, sanitizeHttpsUrl, sanitizeMargin, sanitizeText } from "../core/sanitize/sanitize.js";
import type { FooterBlockData, SocialUrls } from "./types.js";

const EMPTY_SOCIAL: SocialUrls = { instagram: "", facebook: "", x: "", linkedin: "" };

@Block({ type: "footer", label: "Pie de página", icon: "panel-bottom" })
export class FooterBlock extends StyledBlock {
  #address = "";
  #unsubscribeUrl = "";
  #social: SocialUrls = { ...EMPTY_SOCIAL };
  #marginTop = 0;
  #marginBottom = 0;
  #fontSize = 0;

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

  toData(): FooterBlockData {
    return {
      ...this.appearanceData(),
      id: this.id,
      type: "footer",
      address: this.#address,
      unsubscribeUrl: this.#unsubscribeUrl,
      social: { ...this.#social },
      marginTop: this.#marginTop,
      marginBottom: this.#marginBottom,
      fontSize: this.#fontSize,
    };
  }
}
