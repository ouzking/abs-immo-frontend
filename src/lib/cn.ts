/** Concatène des classes conditionnelles (équivalent minimal de clsx). */
export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ')
}
