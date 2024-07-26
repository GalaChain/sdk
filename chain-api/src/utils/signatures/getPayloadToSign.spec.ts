import { getPayloadToSign } from "./getPayloadToSign";

describe("getPayloadToSign", () => {
  it("should sort keys", () => {
    // Given
    const obj = { c: 8, b: [{ z: 6, y: 5, x: 4 }, 7], a: 3 };

    // When
    const toSign = getPayloadToSign(obj);

    // Then
    expect(toSign).toEqual('{"a":3,"b":[{"x":4,"y":5,"z":6},7],"c":8}');
  });

  it("should ignore 'signature' and 'trace' fields", () => {
    // Given
    const obj = { c: 8, signature: "to-be-ignored", trace: 3 };

    // When
    const toSign = getPayloadToSign(obj);

    // Then
    expect(toSign).toEqual('{"c":8}');
  });
});
