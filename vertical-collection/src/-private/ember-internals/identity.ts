import { guidFor } from '@ember/object/internals';

export default function identity(item: unknown): string | number {
  if (typeof item === 'string' || typeof item === 'number') {
    return item;
  }

  return guidFor(item);
}
