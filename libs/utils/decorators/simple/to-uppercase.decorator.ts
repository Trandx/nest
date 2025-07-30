import { Transform } from 'class-transformer';

export function ToUppercase() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toUpperCase();
    }
    return value;
  });
}
