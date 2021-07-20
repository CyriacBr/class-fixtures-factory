// eslint-disable-next-line prettier/prettier
type DotPrefix<T extends string> = T extends "" ? "" : `.${T}`;

export type DeepKeyOf<T> = (
  [T] extends [never] ? "" :
  T extends object ? (
    { [K in Exclude<keyof T, symbol>]:
      `${K}${undefined extends T[K] ? "?" : ""}${DotPrefix<DeepKeyOf<T[K]>>}` }[
    Exclude<keyof T, symbol>]
  ) : ""
) extends infer D ? Extract<D, string> : never;