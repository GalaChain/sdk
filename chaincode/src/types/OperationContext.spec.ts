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
import { Context } from "fabric-contract-api";
import { common, msp, protos } from "fabric-protos";
import { ChaincodeStub } from "fabric-shim";

import { getChaincodeId } from "./OperationContext";

function signedProposalBytes(chaincodeName: string, fcn: string): Uint8Array {
  const invocationSpec = protos.ChaincodeInvocationSpec.encode({
    chaincode_spec: {
      type: protos.ChaincodeSpec.Type.NODE,
      chaincode_id: { name: chaincodeName },
      input: { args: [Buffer.from(fcn), Buffer.from("{}")] }
    }
  }).finish();

  const payload = protos.ChaincodeProposalPayload.encode({ input: invocationSpec }).finish();

  const creator = msp.SerializedIdentity.encode({
    mspid: "CuratorOrg",
    id_bytes: Buffer.from("test-identity")
  }).finish();
  const signatureHeader = common.SignatureHeader.encode({ creator, nonce: Buffer.from("nonce") }).finish();
  const channelHeader = common.ChannelHeader.encode({
    type: common.HeaderType.ENDORSER_TRANSACTION,
    channel_id: "product-channel",
    tx_id: "tx-1",
    epoch: 0
  }).finish();
  const header = common.Header.encode({
    channel_header: channelHeader,
    signature_header: signatureHeader
  }).finish();

  return protos.Proposal.encode({ header, payload }).finish();
}

function shimContext(chaincodeName: string, fcn: string): Context {
  const proposalBytes = signedProposalBytes(chaincodeName, fcn);
  const signedProposalPb = {
    getSignature: () => Buffer.from("signature"),
    getProposalBytes: () => proposalBytes
  };
  const chaincodeInput = { getArgsList_asU8: () => [Buffer.from(fcn), Buffer.from("{}")] };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const StubCtor = ChaincodeStub as any;
  const stub = new StubCtor({}, "product-channel", "tx-1", chaincodeInput, signedProposalPb);

  return { stub } as unknown as Context;
}

describe("getChaincodeId", () => {
  const savedOverride = process.env.GC_CHAINCODE_ID;

  beforeEach(() => {
    delete process.env.GC_CHAINCODE_ID;
  });

  afterAll(() => {
    if (savedOverride === undefined) {
      delete process.env.GC_CHAINCODE_ID;
    } else {
      process.env.GC_CHAINCODE_ID = savedOverride;
    }
  });

  it("reads the chaincode id from the proposal decoded by fabric-shim", () => {
    // Given
    const ctx = shimContext("product-chaincode", "TokenContract:TransferToken");

    // When
    const chaincodeId = getChaincodeId(ctx);

    // Then
    expect(chaincodeId).toEqual("product-chaincode");
  });

  it("prefers the environment override", () => {
    // Given
    const ctx = shimContext("product-chaincode", "TokenContract:TransferToken");
    process.env.GC_CHAINCODE_ID = "configured-chaincode";

    // When
    const chaincodeId = getChaincodeId(ctx);

    // Then
    expect(chaincodeId).toEqual("configured-chaincode");
  });

  it("fails when the proposal payload has no input", () => {
    // Given
    const ctx = {
      stub: {
        getSignedProposal: () => ({ proposal: { payload: { getInput_asU8: () => new Uint8Array() } } })
      }
    } as unknown as Context;

    // When & Then
    expect(() => getChaincodeId(ctx)).toThrow("got empty proposal payload");
  });
});
