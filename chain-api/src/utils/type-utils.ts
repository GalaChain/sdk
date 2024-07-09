// Utility type to pick only optional properties of a class
type OptionalProperties<T> = Pick<T, { [K in keyof T]: T[K] extends Required<T>[K] ? never : K }[keyof T]>;

// Utility type to require only the required properties of a class
type RequiredProperties<T> = Required<
  Pick<T, { [K in keyof T]: T[K] extends Required<T>[K] ? K : never }[keyof T]>
>;

type OmitFields =
  | "validate"
  | "validateOrReject"
  | "serialize"
  | "deserialize"
  | "sign"
  | "signed"
  | "isSignatureValid";

export type ConstructorArgs<T> = RequiredProperties<Omit<T, OmitFields>> &
  Partial<OptionalProperties<Omit<T, OmitFields>>>;
