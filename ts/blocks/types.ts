export type BlockType = "title" | "text" | "image" | "list" | "quote" | "divider";

export interface BaseBlockData {
  readonly id: string;
  readonly type: BlockType;
}

export interface TitleBlockData extends BaseBlockData {
  readonly type: "title";
  content: string;
  level: 1 | 2 | 3;
}

export interface TextBlockData extends BaseBlockData {
  readonly type: "text";
  content: string;
}

export interface ImageBlockData extends BaseBlockData {
  readonly type: "image";
  src: string;
  alt: string;
  caption: string;
}

export interface ListBlockData extends BaseBlockData {
  readonly type: "list";
  items: readonly string[];
  ordered: boolean;
}

export interface QuoteBlockData extends BaseBlockData {
  readonly type: "quote";
  content: string;
  cite: string;
}

export interface DividerBlockData extends BaseBlockData {
  readonly type: "divider";
}

export type AnyBlockData =
  | TitleBlockData
  | TextBlockData
  | ImageBlockData
  | ListBlockData
  | QuoteBlockData
  | DividerBlockData;

export function isBlockType(value: string): value is BlockType {
  return (
    value === "title" ||
    value === "text" ||
    value === "image" ||
    value === "list" ||
    value === "quote" ||
    value === "divider"
  );
}
