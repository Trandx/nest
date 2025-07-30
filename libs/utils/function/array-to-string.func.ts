export function ArrayToString(fields: string[], separator?: string): string {
  return fields
    .map((field, index) => `${field} = $${index + 1}`) // Map each field to `field = $index`
    .join(` ${separator || ','} `); // Join the mapped strings
}
  