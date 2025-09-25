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
import { SubmitCallDTO } from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { authenticate } from "./authenticate";

jest.mock("./authenticate", () => {
  const actual = jest.requireActual("./authenticate");
  return {
    ...actual,
    authenticateAsOriginChaincode: jest.fn()
  };
});

describe("authenticate", () => {
  it("should authorize as origin chaincode", async () => {
    // Given
    const { ctx, chaincodeId } = mockedContext();

    const dto = new SubmitCallDTO();
    dto.signerAddress = `service|${chaincodeId}`;
    dto.signature = undefined;

    const expectedUserData = {
      alias: `service|${chaincodeId}`,
      ethAddress: undefined,
      roles: [],
      signedByKeys: [],
      signatureQuorum: 0
    };

    // When
    const result = await authenticate(ctx, dto);

    // Then
    expect(result).toEqual(expectedUserData);
  });

  it("should fail when chaincodeId in signed proposal does not match the expected chaincodeId", async () => {
    // Given
    const { ctx, chaincodeId } = mockedContext();

    const dto = new SubmitCallDTO();
    dto.signerAddress = `service|untrusted-chaincode`;
    dto.signature = undefined;

    const expectedErrorMessage = `Chaincode authorization failed. Got DTO with signerAddress: ${dto.signerAddress}, but signed proposal has chaincodeId: ${chaincodeId}`;

    // When
    const result = authenticate(ctx, dto);

    // Then
    await expect(result).rejects.toThrow(expectedErrorMessage);
  });
});

function mockedContext() {
  const signedProposal = {
    proposal: {
      payload: {
        array: [
          Buffer.from(
            "CusECAESEQoAEgtiYXNpYy1hc3NldBoAGtMECh9HYWxhQ2hhaW5Ub2tlbjpDcmVhdGVUb2tlbkNsYXNzCq0EeyJkZWNpbWFscyI6MCwiZGVzY3JpcHRpb24iOiJUaGlzIGlzIGEgdGVzdCBkZXNjcmlwdGlvbiEiLCJpbWFnZSI6Imh0dHBzOi8vYXBwLmdhbGEuZ2FtZXMvX251eHQvaW1nL2dhbGEtbG9nb19ob3Jpem9udGFsX3doaXRlLjhiMDQwOWMucG5nIiwiaXNOb25GdW5naWJsZSI6dHJ1ZSwibWF4Q2FwYWNpdHkiOiIxMCIsIm1heFN1cHBseSI6IjEwIiwibmFtZSI6Ik1lZ2FBeGUiLCJuZXR3b3JrIjoiR0MiLCJzaWduYXR1cmUiOiIwYTRhODRmYWRjNDI0NDdjNjFhNjg3ZTJkNDA1YTZjNDc5ZGY3OTllMmQ4OWNkNzliNTRjMzU5MjVjZDA5ZWI3NGVlN2Q0MGYyNGIwNjg0OWExNDc2NDZjZDM0ZWM1NzY5YmE3ZmY1MjA1Nzk2ZjFhYWJjYTI2MzYyNWRiZGE3YjFiIiwic3ltYm9sIjoiTUEiLCJ0b2tlbkNsYXNzIjp7ImFkZGl0aW9uYWxLZXkiOiJub25lIiwiY2F0ZWdvcnkiOiJXZWFwb24iLCJjb2xsZWN0aW9uIjoiTWlyYW5kdXNnY29sdHNkbWppYyIsInR5cGUiOiJNZWdhQXhlIn0sInVuaXF1ZUtleSI6IkxDd2xXQmVoS3JyQnlPZytCNWtvQk92MFhGNXJRT0tQMDhxYmQ0UGZCOWM9In0YAA==",
            "base64"
          )
        ]
      }
    }
  };

  const ctx = { stub: { getSignedProposal: () => signedProposal } } as unknown as GalaChainContext;

  const chaincodeId = "basic-asset";

  return { ctx, chaincodeId };
}
