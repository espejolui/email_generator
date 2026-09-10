export interface BlockMetadata {
  readonly type: string;
  readonly label: string;
  readonly icon: string;
}

const registry = new Map<string, BlockMetadata>();

export function Block(metadata: BlockMetadata) {
  return function <T extends { new (...args: never[]): object }>(target: T): T {
    registry.set(metadata.type, { ...metadata });
    return target;
  };
}

export function getRegisteredBlocks(): readonly BlockMetadata[] {
  return Array.from(registry.values());
}

export function getBlockMetadata(type: string): BlockMetadata | undefined {
  return registry.get(type);
}
