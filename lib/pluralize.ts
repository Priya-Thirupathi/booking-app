/** "guest" or "guests" depending on count — callers prepend the number themselves. */
export function guestWord(n: number): string {
  return n === 1 ? "guest" : "guests";
}
