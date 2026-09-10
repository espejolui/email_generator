/** Mezcla un color `#rrggbb` con blanco. `amount` 0..1 (0 = igual, 1 = blanco). */
export function lightenHex(hex: string, amount: number): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
  const ratio = Math.min(1, Math.max(0, amount));
  const channel = (start: number, length: number): string => {
    const value = Number.parseInt(hex.slice(start, start + length), 16);
    return Math.round(value + (255 - value) * ratio)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(1, 2)}${channel(3, 2)}${channel(5, 2)}`;
}
