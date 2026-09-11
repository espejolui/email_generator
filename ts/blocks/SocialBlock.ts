import { Block } from "../core/decorators/Block.js";
import { Editable } from "../core/decorators/Editable.js";
import { sanitizeHttpsUrl } from "../core/sanitize/sanitize.js";
import type { SocialBlockData, SocialUrls } from "./types.js";

const EMPTY_SOCIAL: SocialUrls = { instagram: "", facebook: "", x: "", linkedin: "" };

@Block({ type: "social", label: "Redes sociales", icon: "share-2" })
export class SocialBlock {
  readonly id: string;
  #social: SocialUrls = { ...EMPTY_SOCIAL };

  constructor(id: string) {
    this.id = id;
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

  toData(): SocialBlockData {
    return { id: this.id, type: "social", social: { ...this.#social } };
  }
}
