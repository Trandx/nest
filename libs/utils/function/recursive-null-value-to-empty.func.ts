export function recursivelyNullValuesToEmpty(value: unknown): unknown {
  //console.log("Type :"+typeof value, "value: "+value);

  if (Array.isArray(value)) {
    return value.map(recursivelyNullValuesToEmpty);
  }

  if (value !== null && !(value instanceof Date) && value instanceof Object) {
    return Object.fromEntries(
      Object.entries(value).map(([key, value]) => [
        key,
        recursivelyNullValuesToEmpty(value),
      ]),
    );
  }
  //console.log(value);

  if (value === null) {
    return '';
  } else {
    return value;
  }
}
