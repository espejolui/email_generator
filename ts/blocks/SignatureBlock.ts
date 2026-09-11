import { Block } from "../core/decorators/Block.js";
import { Editable } from "../core/decorators/Editable.js";
import { sanitizeAlt, sanitizeImageSrc, sanitizeText } from "../core/sanitize/sanitize.js";
import type { SignatureBlockData } from "./types.js";

@Block({ type: "signature", label: "Firma", icon: "pen-line" })
export class SignatureBlock {
  readonly id: string;
  #name = "";
  #role = "";
  #photoSrc = "";
  #photoAlt = "";

  constructor(id: string) {
    this.id = id;
  }

  @Editable()
  set name(value: string) {
    this.#name = sanitizeText(value).slice(0, 120);
  }

  get name(): string {
    return this.#name;
  }

  @Editable()
  set role(value: string) {
    this.#role = sanitizeText(value).slice(0, 120);
  }

  get role(): string {
    return this.#role;
  }

  @Editable()
  set photoSrc(value: string) {
    this.#photoSrc = sanitizeImageSrc(value);
  }

  get photoSrc(): string {
    return this.#photoSrc;
  }

  @Editable()
  set photoAlt(value: string) {
    this.#photoAlt = sanitizeAlt(value);
  }

  get photoAlt(): string {
    return this.#photoAlt;
  }

  toData(): SignatureBlockData {
    return {
      id: this.id,
      type: "signature",
      name: this.#name,
      role: this.#role,
      photoSrc: this.#photoSrc,
      photoAlt: this.#photoAlt,
    };
  }
}
