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

/** Lista blanca para enlaces de botón: solo https:. Cualquier otra cosa -> "". */
export function sanitizeHref(input: string): string {
  const value = input.trim();
  if (value === "") return "";
  try {
    const url = new URL(value);
    if (url.protocol === "https:") return url.toString();
  } catch {
    return "";
  }
  return "";
}
