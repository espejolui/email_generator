import { Block } from "../core/decorators/Block.js";
import { StyledBlock } from "./StyledBlock.js";
import { Editable } from "../core/decorators/Editable.js";
import { sanitizeFontSize, sanitizeHttpsUrl, sanitizeMargin } from "../core/sanitize/sanitize.js";
import type { SocialBlockData, SocialUrls } from "./types.js";

const EMPTY_SOCIAL: SocialUrls = { instagram: "", facebook: "", x: "", linkedin: "" };

@Block({ type: "social", label: "Redes sociales", icon: "share-2" })
export class SocialBlock extends StyledBlock {
  #social: SocialUrls = { ...EMPTY_SOCIAL };
  #marginTop = 0;
  #marginBottom = 0;
  #fontSize = 0;

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

  toData(): SocialBlockData {
    return {
      ...this.appearanceData(),
      id: this.id,
      type: "social",
      social: { ...this.#social },
      marginTop: this.#marginTop,
      marginBottom: this.#marginBottom,
      fontSize: this.#fontSize,
    };
  }
}
