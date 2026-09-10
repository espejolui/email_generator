export type BlockType = "title" | "text" | "image" | "list" | "quote" | "divider" | "button";

export type ButtonColor = "green" | "blue";

export type TitleLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type TextAlign = "left" | "center" | "right";

export type ButtonAlign = "left" | "center" | "right";

export interface BaseBlockData {
  readonly id: string;
  readonly type: BlockType;
}

export interface TitleBlockData extends BaseBlockData {
  readonly type: "title";
  content: string;
  level: TitleLevel;
  align: TextAlign;
  bg: string;
  color: string;
  marginTop: number;
  marginBottom: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
}

export interface TextBlockData extends BaseBlockData {
  readonly type: "text";
  content: string;
  align: TextAlign;
  bg: string;
  color: string;
  marginTop: number;
  marginBottom: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
}

export interface ImageBlockData extends BaseBlockData {
  readonly type: "image";
  src: string;
  alt: string;
}

export interface ListBlockData extends BaseBlockData {
  readonly type: "list";
  items: readonly string[];
  ordered: boolean;
  align: TextAlign;
}

export interface QuoteBlockData extends BaseBlockData {
  readonly type: "quote";
  content: string;
  cite: string;
  align: TextAlign;
  bg: string;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  marginTop: number;
  marginBottom: number;
}

export interface DividerBlockData extends BaseBlockData {
  readonly type: "divider";
  color: string;
  marginTop: number;
  marginBottom: number;
  thickness: number;
  borderRadius: number;
}

export interface ButtonBlockData extends BaseBlockData {
  readonly type: "button";
  label: string;
  phone: string;
  message: string;
  color: ButtonColor;
  align: ButtonAlign;
  marginTop: number;
  marginBottom: number;
}

export type AnyBlockData =
  | TitleBlockData
  | TextBlockData
  | ImageBlockData
  | ListBlockData
  | QuoteBlockData
  | DividerBlockData
  | ButtonBlockData;

export function isBlockType(value: string): value is BlockType {
  return (
    value === "title" ||
    value === "text" ||
    value === "image" ||
    value === "list" ||
    value === "quote" ||
    value === "divider" ||
    value === "button"
  );
}

export function isButtonColor(value: string): value is ButtonColor {
  return value === "green" || value === "blue";
}

export function isTitleLevel(value: unknown): value is TitleLevel {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5 || value === 6;
}

export function isTextAlign(value: string): value is TextAlign {
  return value === "left" || value === "center" || value === "right";
}

export function isButtonAlign(value: string): value is ButtonAlign {
  return value === "left" || value === "center" || value === "right";
}
