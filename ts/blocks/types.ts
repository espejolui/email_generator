export type BlockType =
  | "title"
  | "text"
  | "image"
  | "list"
  | "quote"
  | "divider"
  | "button"
  | "spacer"
  | "header"
  | "footer"
  | "cta"
  | "columns"
  | "table"
  | "social"
  | "banner"
  | "product"
  | "coupon"
  | "signature";

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

export interface SpacerBlockData extends BaseBlockData {
  readonly type: "spacer";
  height: number;
}

export interface HeaderBlockData extends BaseBlockData {
  readonly type: "header";
  logoSrc: string;
  logoAlt: string;
  tagline: string;
  align: TextAlign;
}

export interface SocialUrls {
  instagram: string;
  facebook: string;
  x: string;
  linkedin: string;
}

export interface FooterBlockData extends BaseBlockData {
  readonly type: "footer";
  address: string;
  unsubscribeUrl: string;
  social: SocialUrls;
}

export interface CtaBlockData extends BaseBlockData {
  readonly type: "cta";
  label: string;
  url: string;
  color: ButtonColor;
  align: ButtonAlign;
  marginTop: number;
  marginBottom: number;
}

export interface ColumnData {
  blocks: readonly AnyBlockData[];
}

export interface ColumnsBlockData extends BaseBlockData {
  readonly type: "columns";
  columns: readonly ColumnData[];
}

export interface TableBlockData extends BaseBlockData {
  readonly type: "table";
  headers: readonly string[];
  rows: readonly (readonly string[])[];
  headerRow: boolean;
}

export interface SocialBlockData extends BaseBlockData {
  readonly type: "social";
  social: SocialUrls;
}

export interface BannerBlockData extends BaseBlockData {
  readonly type: "banner";
  src: string;
  alt: string;
  href: string;
  caption: string;
}

export interface ProductBlockData extends BaseBlockData {
  readonly type: "product";
  src: string;
  alt: string;
  name: string;
  price: string;
  url: string;
  buttonLabel: string;
  color: ButtonColor;
}

export interface CouponBlockData extends BaseBlockData {
  readonly type: "coupon";
  code: string;
  description: string;
}

export interface SignatureBlockData extends BaseBlockData {
  readonly type: "signature";
  name: string;
  role: string;
  photoSrc: string;
  photoAlt: string;
}

export type AnyBlockData =
  | TitleBlockData
  | TextBlockData
  | ImageBlockData
  | ListBlockData
  | QuoteBlockData
  | DividerBlockData
  | ButtonBlockData
  | SpacerBlockData
  | HeaderBlockData
  | FooterBlockData
  | CtaBlockData
  | ColumnsBlockData
  | TableBlockData
  | SocialBlockData
  | BannerBlockData
  | ProductBlockData
  | CouponBlockData
  | SignatureBlockData;

export function isBlockType(value: string): value is BlockType {
  return (
    value === "title" ||
    value === "text" ||
    value === "image" ||
    value === "list" ||
    value === "quote" ||
    value === "divider" ||
    value === "button" ||
    value === "spacer" ||
    value === "header" ||
    value === "footer" ||
    value === "cta" ||
    value === "columns" ||
    value === "table" ||
    value === "social" ||
    value === "banner" ||
    value === "product" ||
    value === "coupon" ||
    value === "signature"
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
