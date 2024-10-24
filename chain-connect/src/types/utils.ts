export type PublicProperties<T> = {
  -readonly [K in keyof T]: T[K]; // Remove readonly
};
