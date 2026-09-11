const ESCAPE_MAP: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function sanitizeText(input: string): string {
  return input.replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch] ?? ch);
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value, "https://invalid.local");
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function isAllowedDataImage(value: string): boolean {
  return /^data:image\/(png|jpeg|gif|webp);base64,[a-zA-Z0-9+/=]+$/.test(value);
}

/** Lista blanca: solo https: o data:image/* controlado. Cualquier otra cosa -> "". */
export function sanitizeImageSrc(input: string): string {
  const value = input.trim();
  if (isAllowedDataImage(value)) return value;
  if (isHttpUrl(value) || value.startsWith("https://")) {
    try {
      const url = new URL(value);
      if (url.protocol === "https:") return url.toString();
    } catch {
      return "";
    }
  }
  return "";
}

export function sanitizeAlt(input: string): string {
  return sanitizeText(input).slice(0, 200);
}

/**
 * Solo URLs absolutas `https:`. Difiere de `sanitizeImageSrc` (que admite
 * `data:image/*` controlado) a propósito: los enlaces de navegación del
 * email nunca deben ser data: ni relativos.
 */
export function sanitizeHttpsUrl(input: string): string {
  const value = input.trim();
  if (value === "") return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

/** Solo dígitos (sin "+", espacios ni guiones). */
export function sanitizePhone(input: string): string {
  return input.replace(/\D/g, "").slice(0, 15);
}

/** Indicativo por defecto cuando el usuario escribe el celular sin él. */
const DEFAULT_COUNTRY_CODE = "57";

/** Arma el enlace oficial de WhatsApp Click-to-Chat: https://wa.me/<tel>?text=<msg>. */
export function buildWhatsAppUrl(phone: string, message: string): string {
  let digits = sanitizePhone(phone);
  if (digits === "") return "";
  if (!digits.startsWith(DEFAULT_COUNTRY_CODE)) digits = `${DEFAULT_COUNTRY_CODE}${digits}`;
  const text = message.trim().slice(0, 300);
  return text === ""
    ? `https://wa.me/${digits}`
    : `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

/** Solo hexadecimal #rrggbb. Cualquier otra cosa -> "" (automático/degradado). */
export function sanitizeColor(input: string): string {
  const value = input.trim();
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : "";
}

/** Entero 0-80 para márgenes en px. Inválido -> 8. */
export function sanitizeMargin(input: string): number {
  const parsed = Number.parseInt(input, 10);
  if (Number.isNaN(parsed)) return 8;
  return Math.min(80, Math.max(0, parsed));
}
