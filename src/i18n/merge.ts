/** Objet dont chaque clé (récursivement) est facultative ; les tableaux sont fusionnés élément par élément. */
export type DeepPartial<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> }
      : T

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Superpose une traduction partielle à la langue de référence (repli clé par clé). */
export function deepMerge<T>(base: T, override: DeepPartial<T> | undefined): T {
  if (override === undefined) return base
  if (Array.isArray(base) && Array.isArray(override)) {
    return base.map((item, i) => deepMerge(item, override[i] as DeepPartial<typeof item>)) as T
  }
  if (isPlainObject(base) && isPlainObject(override)) {
    const out: Record<string, unknown> = { ...base }
    for (const [k, v] of Object.entries(override)) {
      out[k] = deepMerge((base as Record<string, unknown>)[k], v as never)
    }
    return out as T
  }
  return override as T
}
