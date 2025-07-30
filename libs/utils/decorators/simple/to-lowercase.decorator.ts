import { Transform } from 'class-transformer';

export function ToLowercase() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase();
    }
    return value;
  });
}
