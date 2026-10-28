import { defineProperties } from "./properties";

describe("defineProperties", () => {
  it("accepts a value that matches one member of a union", () => {
    const target: { amount?: number } = {};

    defineProperties(target, { amount: 1 }, { amount: "string | number" });

    expect(target.amount).toBe(1);
  });

  it("accepts a string when the union includes string", () => {
    const target: { amount?: string } = {};

    defineProperties(target, { amount: "1" }, { amount: "string | number" });

    expect(target.amount).toBe("1");
  });

  it("rejects a value that matches no union member", () => {
    const target: { amount?: boolean } = {};

    expect(() => defineProperties(target, { amount: true }, { amount: "string | number" })).toThrow(
      /invalid value for type string \| number/
    );
  });
});
