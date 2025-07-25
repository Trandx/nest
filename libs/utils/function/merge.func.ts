export type ObjectType = Record<string, any>;

export function merge<T extends ObjectType>(target: T | null | undefined, ...sources: ObjectType[]): T {
  // Create a new object to avoid mutating the original target
  const result = { ...(target || {}) } as T;
  
  for (const source of sources) {
    if (typeof source !== 'object' || source === null) {
      throw new Error('Source must be a non-null object');
    }
    
    for (const key of Object.keys(source)) {
      const value = source[key];
      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        (result as any)[key] = merge(
          (result[key] && typeof result[key] === 'object' && !Array.isArray(result[key]) ? result[key] : {}),
          value
        );
      } else {
        (result as any)[key] = value;
      }
    }
  }
  
  return result;
}