import { Context } from "fabric-contract-api";

import { legacyClientAccountId } from "./legacyClientAccountId";

describe("legacyClientAccountId", () => {
  let ctx: Context;

  beforeEach(() => {
    ctx = new Context();
    ctx.clientIdentity = {
      getID: jest
        .fn()
        .mockReturnValue(
          "x509::/OU=org/CN=name::/C=US/ST=California/L=San Francisco/O=curator.local/CN=ca.curator.local"
        ),
      assertAttributeValue: jest.fn(),
      getAttributeValue: jest.fn(),
      getIDBytes: jest.fn(),
      getMSPID: jest.fn()
    };
  });

  test("should return the legacy client account ID", () => {
    const result = legacyClientAccountId(ctx);
    expect(result).toBe("org|name");
  });

  test("should throw an error for invalid client account ID format", () => {
    ctx.clientIdentity = {
      getID: jest
        .fn()
        .mockReturnValue("x509::/OU=/CN=::/C=US/ST=/L=San Francisco/O=curator.local/CN=ca.curator.local"),
      assertAttributeValue: jest.fn(),
      getAttributeValue: jest.fn(),
      getIDBytes: jest.fn(),
      getMSPID: jest.fn()
    };
    expect(() => legacyClientAccountId(ctx)).toThrow("Invalid client account ID format");
  });
});
