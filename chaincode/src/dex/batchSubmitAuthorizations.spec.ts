/*
 * Copyright (c) Gala Games Inc. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {
  AuthorizeBatchSubmitterDto,
  BatchSubmitAuthorities,
  BatchSubmitAuthoritiesResDto,
  DeauthorizeBatchSubmitterDto,
  FetchBatchSubmitAuthoritiesDto,
  UnauthorizedError,
  ValidationFailedError
} from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { getObjectByKey, putChainObject } from "../utils";
import {
  authorizeBatchSubmitter,
  deauthorizeBatchSubmitter,
  fetchBatchSubmitAuthorities,
  getBatchSubmitAuthorities
} from "./batchSubmitAuthorizations";

// Mock the utils module
jest.mock("../utils", () => ({
  getObjectByKey: jest.fn(),
  putChainObject: jest.fn()
}));

// Mock context for testing
const createMockContext = (callingUser: string): GalaChainContext => {
  const mockStub = {
    createCompositeKey: (indexKey: string, attributes: string[]) => {
      return `${indexKey}${attributes.join("|")}`;
    },
    getState: jest.fn(),
    putState: jest.fn()
  };

  return {
    callingUser,
    stub: mockStub as any,
    clientIdentity: {
      getMSPID: () => "CuratorOrg"
    } as any
  } as GalaChainContext;
};

describe("BatchSubmitAuthorizations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("BatchSubmitAuthorizations chain object", () => {
    it("should create with initial authorities", () => {
      const auth = new BatchSubmitAuthorities(["user1", "user2"]);
      expect(auth.authorities).toEqual(["user1", "user2"]);
    });

    it("should add authority", () => {
      const auth = new BatchSubmitAuthorities(["user1"]);
      auth.addAuthority("user2");
      expect(auth.authorities).toEqual(["user1", "user2"]);
    });

    it("should not add duplicate authority", () => {
      const auth = new BatchSubmitAuthorities(["user1"]);
      auth.addAuthority("user1");
      expect(auth.authorities).toEqual(["user1"]);
    });

    it("should remove authority", () => {
      const auth = new BatchSubmitAuthorities(["user1", "user2"]);
      auth.removeAuthority("user1");
      expect(auth.authorities).toEqual(["user2"]);
    });

    it("should check if user is authorized", () => {
      const auth = new BatchSubmitAuthorities(["user1", "user2"]);
      expect(auth.isAuthorized("user1")).toBe(true);
      expect(auth.isAuthorized("user3")).toBe(false);
    });

    it("should get authorized authorities", () => {
      const auth = new BatchSubmitAuthorities(["user1", "user2"]);
      const authorities = auth.getAuthorities();
      expect(authorities).toEqual(["user1", "user2"]);
      // Should return a copy, not the original array
      authorities.push("user3");
      expect(auth.authorities).toEqual(["user1", "user2"]);
    });
  });

  describe("fetchBatchSubmitAuthorizations", () => {
    it("should return existing authorizations", async () => {
      const ctx = createMockContext("user1");
      const existingAuth = new BatchSubmitAuthorities(["user1", "user2"]);

      (getObjectByKey as jest.Mock).mockResolvedValue(existingAuth);
      (putChainObject as jest.Mock).mockResolvedValue(undefined);

      const result = await fetchBatchSubmitAuthorities(ctx);

      expect(result).toBe(existingAuth);
    });
  });

  describe("authorizeBatchSubmitter", () => {
    it("should authorize new users when caller is authorized", async () => {
      const ctx = createMockContext("user1");
      const existingAuth = new BatchSubmitAuthorities(["user1"]);

      (getObjectByKey as jest.Mock).mockResolvedValue(existingAuth);
      (putChainObject as jest.Mock).mockResolvedValue(undefined);

      const dto = new AuthorizeBatchSubmitterDto();
      dto.authorities = ["user2", "user3"];

      const result = await authorizeBatchSubmitter(ctx, dto);

      expect(result).toBeInstanceOf(BatchSubmitAuthoritiesResDto);
      expect(result.authorities).toContain("user1");
      expect(result.authorities).toContain("user2");
      expect(result.authorities).toContain("user3");
    });
  });

  describe("deauthorizeBatchSubmitter", () => {
    it("should deauthorize user when caller is authorized", async () => {
      const ctx = createMockContext("user1");
      const existingAuth = new BatchSubmitAuthorities(["user1", "user2"]);

      (getObjectByKey as jest.Mock).mockResolvedValue(existingAuth);
      (putChainObject as jest.Mock).mockResolvedValue(undefined);

      const dto = new DeauthorizeBatchSubmitterDto();
      dto.authority = "user2";

      const result = await deauthorizeBatchSubmitter(ctx, dto);

      expect(result).toBeInstanceOf(BatchSubmitAuthoritiesResDto);
      expect(result.authorities).toContain("user1");
      expect(result.authorities).not.toContain("user2");
    });
  });

  describe("getBatchSubmitAuthorizations", () => {
    it("should return current authorizations", async () => {
      const ctx = createMockContext("user1");
      const existingAuth = new BatchSubmitAuthorities(["user1", "user2"]);

      (getObjectByKey as jest.Mock).mockResolvedValue(existingAuth);

      const dto = new FetchBatchSubmitAuthoritiesDto();
      const result = await getBatchSubmitAuthorities(ctx, dto);

      expect(result).toBeInstanceOf(BatchSubmitAuthoritiesResDto);
      expect(result.authorities).toEqual(["user1", "user2"]);
    });
  });
});
