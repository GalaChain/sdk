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
import { ClientIdentity, ChaincodeStub as FChaincodeStub, Iterators, StateQueryResponse } from "fabric-shim";
import Long from "long";
import { nanoid } from "nanoid";

import { FabricIterable, asyncIterator, fabricIterable, filter } from "./FabricIterable";

/* eslint-disable  @typescript-eslint/no-misused-new */
export interface ChaincodeStubClassType extends FChaincodeStub {
  new (client, channel_id, txId, chaincodeInput, signedProposal): ChaincodeStubClassType;

  creator: unknown;

  createCompositeKey(objectType: string, attributes: string[]): string;
}

// eslint-disable-next-line global-require
/* eslint-disable  @typescript-eslint/no-var-requires */
const ChaincodeStub = require("fabric-shim/lib/stub") as ChaincodeStubClassType;

const sampleIdBytes = Buffer.from(`-----BEGIN CERTIFICATE-----
MIICTzCCAfagAwIBAgIQKX7n2CQ9hyHjB/xBlumWmTAKBggqhkjOPQQDAjBmMQsw
CQYDVQQGEwJVUzETMBEGA1UECBMKQ2FsaWZvcm5pYTEWMBQGA1UEBxMNU2FuIEZy
YW5jaXNjbzERMA8GA1UEChMIcm9vdC5jb20xFzAVBgNVBAMTDnRsc2NhLnJvb3Qu
Y29tMB4XDTIxMTEwNTE0MTgwMFoXDTMxMTEwMzE0MTgwMFowVjELMAkGA1UEBhMC
VVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNhbiBGcmFuY2lzY28x
GjAYBgNVBAMTEW9yZGVyZXIwLnJvb3QuY29tMFkwEwYHKoZIzj0CAQYIKoZIzj0D
AQcDQgAE8Kj9Ggxj2jPY+bPFJ4fS0yfDMf1RLqwzR+oL38MZ2Bb1PtjUhd6uayvl
qURcnkKPwwRlD8Rucu8NbooBXN1NK6OBlTCBkjAOBgNVHQ8BAf8EBAMCBaAwHQYD
VR0lBBYwFAYIKwYBBQUHAwEGCCsGAQUFBwMCMAwGA1UdEwEB/wQCMAAwKwYDVR0j
BCQwIoAgoOMq1siwgaiOmsuy+wG4hfxB0V5mD9FeuJGDYWNFCuowJgYDVR0RBB8w
HYIRb3JkZXJlcjAucm9vdC5jb22CCG9yZGVyZXIwMAoGCCqGSM49BAMCA0cAMEQC
IGYQH8J4+PICOoEcHZAuaQYh53DHSONgC1/A45aWNoE/AiAfnoxXiiD2f1MdiKx4
neOrBgBGMDzq2aBbdX5EeQZbAw==
-----END CERTIFICATE-----`);

function x509Identity(caUser: string, mspId: string): ClientIdentity {
  const userInCert = caUser.replace("client|", "");
  const id = `x509::/OU=client/CN=${userInCert}::/C=US/ST=California/L=San Francisco/O=curator.local/CN=ca.curator.local`;

  return {
    assertAttributeValue(attrValue: string): boolean {
      throw new Error("Method 'assertAttributeValue' not implemented.");
    },
    getAttributeValue(attrName: string): string | null {
      throw new Error("Method 'getAttributeValue' not implemented.");
    },
    getMSPID: () => mspId,
    getID: () => id,
    getIDBytes: () => sampleIdBytes
  };
}

const creatorMock = () => ({
  mspid: "CuratorOrg",
  id: "x509::/OU=client/CN=admin::/C=US/ST=California/L=San Francisco/O=curator.local/CN=ca.curator.local",
  idBytes: sampleIdBytes
});

export class TestChaincodeStub extends ChaincodeStub {
  private static epoch = 0;
  public readonly state: Record<string, string>;
  public readonly writes: Record<string, string>;

  constructor(
    args: string[],
    state: Record<string, string> | undefined,
    writes: Record<string, string> | undefined
  ) {
    super({}, "asset-channel", nanoid(), { getArgsList_asU8: () => args }, undefined);
    this.creator = creatorMock();
    this.state = state ?? {};
    this.writes = writes ?? {};

    const seconds = Long.fromNumber(Date.now() / 1000);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.txTimestamp = {
      seconds,
      nanos: 0,
      getSeconds: () => seconds,
      getNanos: () => 0
    };

    TestChaincodeStub.epoch += 1;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.signedProposal = {
      proposal: {
        header: {
          channelHeader: {
            epoch: 0
          }
        }
      }
    };
  }

  public getClientIdentity(caUser: string, mspId: string): ClientIdentity {
    return x509Identity(caUser, mspId);
  }

  mockState(key: string, value: string): void {
    this.state[key] = value;
  }

  putState: (key: string, value: Uint8Array) => Promise<void> = (key, value) => {
    const valueString = value.toString();
    this.state[key] = valueString;
    this.writes[key] = valueString;

    return Promise.resolve();
  };

  deleteState: (key: string) => Promise<void> = (key) => {
    delete this.state[key];
    this.writes[key] = "";

    return Promise.resolve();
  };

  getState: (key: string) => Promise<Uint8Array> = (key) => {
    const response = this.state[key] ?? "";

    return Promise.resolve(Buffer.from(response));
  };

  getStateByPartialCompositeKey: (objectType: string, attributes: string[]) => FabricIterable<Iterators.KV> =
    (objectType, attributes) => {
      const partialCompositeKey = this.createCompositeKey(objectType, attributes);

      const kvs: Iterators.KV[] = Object.entries(this.state)
        .filter(([k]) => k.startsWith(partialCompositeKey))
        .map(([k, v]) => ({ namespace: "test-chaincode-name", key: k, value: Buffer.from(v) }));

      return fabricIterable(asyncIterator(kvs));
    };

  getStateByPartialCompositeKeyWithPagination(
    indexKey: string,
    keyParts: string[]
  ): Promise<StateQueryResponse<Iterators.StateQueryIterator>> & AsyncIterable<Iterators.KV> {
    const partialKey = "\u0000" + [indexKey, ...keyParts].join("\u0000");
    const keys = Object.keys(this.state)
      .filter((k) => k.startsWith(partialKey))
      .sort();

    const kvs: Iterators.KV[] = keys.map((key) => ({
      key,
      value: Buffer.from(this.state[key]),
      namespace: "???"
    }));

    const iterator = fabricIterable<Iterators.KV>(asyncIterator(kvs));

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    iterator.metadata = {
      bookmark: "",
      fetchedRecordsCount: kvs.length
    };

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return iterator;
  }

  getStateByRange(
    start: string,
    end: string
  ): Promise<Iterators.StateQueryIterator> & AsyncIterable<Iterators.KV> {
    const keys = Object.keys(this.state).sort();

    const kvs: Iterators.KV[] = keys.map((key) => ({
      key,
      value: Buffer.from(this.state[key]),
      namespace: "???"
    }));

    const iterator = asyncIterator(kvs);
    const filtered = filter((obj) => obj.key >= start && obj.key < end, iterator);
    return fabricIterable<Iterators.KV>(filtered);
  }
}
