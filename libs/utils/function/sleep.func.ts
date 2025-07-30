/**
 *
 * @param ms in milliseconds
 * @returns Promise
 */
export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
