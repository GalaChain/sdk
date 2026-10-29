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
import { GalaChainContext } from "../types";
import { ensureCorrectMethodIsUsed } from "./authorize";

type SignedDto = NonNullable<Parameters<typeof ensureCorrectMethodIsUsed>[1]>;

const channel = "asset-channel";
const chaincode = "basic-asset";
const method = "GalaChainToken:TransferToken";
const operation = `${channel}_${chaincode}_${method}`;

function ctxFor(fullOperationId: string, isMultisig = false): GalaChainContext {
  return {
    isMultisig,
    operationCtx: { channelId: channel, chaincodeId: chaincode, methodName: method, fullOperationId }
  } as GalaChainContext;
}

function signedDto(dtoOperation?: string): SignedDto {
  return { signature: "sig", dtoOperation } as SignedDto;
}

describe("ensureCorrectMethodIsUsed", () => {
  it("allows an unsigned DTO without dtoOperation", () => {
    expect(() => ensureCorrectMethodIsUsed(ctxFor(operation), {} as SignedDto)).not.toThrow();
  });

  it("rejects a signed DTO without dtoOperation", () => {
    expect(() => ensureCorrectMethodIsUsed(ctxFor(operation), signedDto())).toThrow(/dtoOperation/);
  });

  it("allows a signed DTO without dtoOperation when the invocation has no function name", () => {
    const ctx = ctxFor(`${channel}_${chaincode}_`);
    (ctx.operationCtx as { methodName: string }).methodName = "";

    expect(() => ensureCorrectMethodIsUsed(ctx, signedDto())).not.toThrow();
  });

  it("rejects a multisignature DTO without dtoOperation", () => {
    const dto = { multisig: ["sig-a", "sig-b"] } as SignedDto;

    expect(() => ensureCorrectMethodIsUsed(ctxFor(operation, true), dto)).toThrow(/multisig/);
  });

  it("accepts a signed DTO bound to the current operation", () => {
    expect(() => ensureCorrectMethodIsUsed(ctxFor(operation), signedDto(operation))).not.toThrow();
  });

  it("rejects a signed DTO when only the channel differs", () => {
    const other = `other-channel_${chaincode}_${method}`;
    expect(() => ensureCorrectMethodIsUsed(ctxFor(operation), signedDto(other))).toThrow(/other-channel/);
  });

  it("rejects a signed DTO when only the chaincode differs", () => {
    const other = `${channel}_other-chaincode_${method}`;
    expect(() => ensureCorrectMethodIsUsed(ctxFor(operation), signedDto(other))).toThrow(/other-chaincode/);
  });

  it("rejects a signed DTO when only the method differs", () => {
    const other = `${channel}_${chaincode}_GalaChainToken:FreezeTokenBalance`;
    expect(() => ensureCorrectMethodIsUsed(ctxFor(operation), signedDto(other))).toThrow(
      /FreezeTokenBalance/
    );
  });
});
