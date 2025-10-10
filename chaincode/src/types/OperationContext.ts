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

export interface OperationContext {
  channelId: string;
  chaincodeId: string;
  methodName: string;
  fullOperationId: string;
}

export function getOperationContext(ctx: Context): OperationContext {
  const channelId = ctx.stub.getChannelID();
  const chaincodeId = getChaincodeId(ctx);
  const methodName = ctx.stub.getFunctionAndParameters().fcn;
  const fullOperationId = `${channelId}_${chaincodeId}_${methodName}`;

  return { channelId, chaincodeId, methodName, fullOperationId };
}

export function getChaincodeId(ctx: Context): string {
  const signedProposal = ctx.stub.getSignedProposal();
  if (!signedProposal) {
    const message = "Cannot get chaincode id: got empty signed proposal.";
    throw new RuntimeError(message);
  }

  // @ts-expect-error error in fabric types mapping
  const proposalPayload = signedProposal.proposal.payload?.array?.[0];

  if (!proposalPayload) {
    const message = "Cannot get chaincode id: got empty proposal payload in signed proposal.";
    throw new RuntimeError(message);
  }

  const decodedProposal = protos.ChaincodeProposalPayload.decode(proposalPayload);
  const invocationSpec = protos.ChaincodeInvocationSpec.decode(decodedProposal.input);
  const chaincodeId = invocationSpec.chaincode_spec?.chaincode_id?.name;

  if (!chaincodeId) {
    const message = "Cannot get chaincode id: got empty chaincodeId in signed proposal.";
    throw new RuntimeError(message);
  }

  return chaincodeId;
}
