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
import { RuntimeError } from "@gala-chain/api";
import { Context } from "fabric-contract-api";
import { protos } from "fabric-protos";
import { ChaincodeStub } from "fabric-shim";

export interface OperationContext {
  channelId: string;
  chaincodeId: string;
  methodName: string;
  fullOperationId: string;
}

export function getOperationContext(ctx: Context, contractName?: string): OperationContext {
  const channelId = ctx.stub.getChannelID();
  const chaincodeId = getChaincodeId(ctx);
  const fcn = ctx.stub.getFunctionAndParameters().fcn;
  // A call routed to the default contract may omit the "Contract:" prefix.
  // Use the same Contract:Method form that clients sign and batches bind.
  const methodName = contractName && fcn && !fcn.includes(":") ? `${contractName}:${fcn}` : fcn;
  const fullOperationId = `${channelId}_${chaincodeId}_${methodName}`;

  return { channelId, chaincodeId, methodName, fullOperationId };
}

export function getChaincodeId(ctx: Context): string {
  if (process.env.GC_CHAINCODE_ID) {
    return process.env.GC_CHAINCODE_ID;
  }

  const invocationSpec = decodeProposalInvocationSpec(ctx.stub, "Cannot get chaincode id");
  const chaincodeId = invocationSpec.chaincode_spec?.chaincode_id?.name;

  if (!chaincodeId) {
    const message = "Cannot get chaincode id: got empty chaincodeId in signed proposal.";
    throw new RuntimeError(message);
  }

  return chaincodeId;
}

/**
 * Arguments of the client's original request, as recorded in the signed proposal.
 *
 * A chaincode invoked directly by the client receives these same arguments.
 * A chaincode reached through `invokeChaincode` receives the caller's arguments
 * instead, while the signed proposal still describes the original request.
 */
export function getProposalArgs(stub: ChaincodeStub): Uint8Array[] {
  const invocationSpec = decodeProposalInvocationSpec(stub, "Cannot get proposal arguments");
  return invocationSpec.chaincode_spec?.input?.args ?? [];
}

function decodeProposalInvocationSpec(
  stub: ChaincodeStub,
  errorPrefix: string
): protos.ChaincodeInvocationSpec {
  const signedProposal = stub.getSignedProposal();
  if (!signedProposal) {
    throw new RuntimeError(`${errorPrefix}: got empty signed proposal.`);
  }

  // fabric-shim sets the payload to the generated ChaincodeProposalPayload message,
  // so the invocation spec bytes are read through its accessor.
  const payload = signedProposal.proposal?.payload as unknown as { getInput_asU8?: () => Uint8Array };
  const input = typeof payload?.getInput_asU8 === "function" ? payload.getInput_asU8() : undefined;

  if (!input || input.length === 0) {
    throw new RuntimeError(`${errorPrefix}: got empty proposal payload in signed proposal.`);
  }

  return protos.ChaincodeInvocationSpec.decode(input);
}
