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

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[P] extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepPartial<U>>
    : DeepPartial<T[P]>;
};

export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends Array<infer U>
    ? Array<DeepRequired<U>>
    : T[P] extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepRequired<U>>
    : DeepRequired<T[P]>;
};