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
  ChainCallDTO,
  GetPublicKeyDto,
  PublicKey,
  RegisterEthUserDto,
  SigningScheme,
  createValidChainObject,
  createValidDTO,
  createValidSubmitDTO,
  signatures
} from "@gala-chain/api";
import { execSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import process from "process";

import { transactionErrorKey, transactionSuccess } from "../matchers";
import { MockedChaincodeClientBuilder } from "./MockedChaincodeClient";

let admin, user, chaincodeIndexJs;

beforeAll(async () => {
  // Setup admin
  admin = signatures.genKeyPair();
  process.env.DEV_ADMIN_PUBLIC_KEY = admin.publicKey;

  // Prepare user data
  const userKeys = signatures.genKeyPair();
  const userAlias = `eth|${signatures.getEthAddress(userKeys.publicKey)}`;
  user = {
    ...userKeys,
    base64PublicKey: signatures.getCompactBase64PublicKey(userKeys.publicKey),
    alias: userAlias
  };

  // Setup chaincode
  chaincodeIndexJs = await ensureChaincode();
});

afterAll(() => {
  // Cleanup
  process.env.DEV_ADMIN_PUBLIC_KEY = undefined;
});

it("should be able to call chaincode", async () => {
  // Given
  const client = createClient(chaincodeIndexJs);
  const dto = new ChainCallDTO().signed(admin.privateKey);

  // When
  const response = await client.submitTransaction("GetPublicKey", dto);

  // Then
  expect(response).toEqual(transactionErrorKey("PK_NOT_FOUND"));
});

it("should support the global state", async () => {
  // Given
  const client1 = createClient(chaincodeIndexJs);
  const client2 = createClient(chaincodeIndexJs);

  const registerDto = await createValidSubmitDTO(RegisterEthUserDto, { publicKey: user.publicKey });
  registerDto.sign(admin.privateKey);

  const getProfileDto = await createValidDTO(GetPublicKeyDto, { user: user.alias });

  const expectedPublicKey = await createValidChainObject(PublicKey, {
    publicKey: user.base64PublicKey,
    signing: SigningScheme.ETH
  });

  // initially the key is missing
  const noKeyResponse = await client1.evaluateTransaction("GetPublicKey", getProfileDto);
  expect(noKeyResponse).toEqual(transactionErrorKey("PK_NOT_FOUND"));

  // When
  const registerResponse = await client1.submitTransaction("RegisterEthUser", registerDto);

  // Then
  expect(registerResponse).toEqual(transactionSuccess());

  // both clients can get the key
  const keyResponse1 = await client1.evaluateTransaction("GetPublicKey", getProfileDto);
  const keyResponse2 = await client2.evaluateTransaction("GetPublicKey", getProfileDto);
  expect(keyResponse1).toEqual(transactionSuccess(expectedPublicKey));
  expect(keyResponse2).toEqual(transactionSuccess(expectedPublicKey));
});

it("should not change the state for evaluateTransaction", async () => {
  // Given
  const client = createClient(chaincodeIndexJs);

  const otherUser = signatures.genKeyPair();
  const otherUserAlias = `eth|${signatures.getEthAddress(otherUser.publicKey)}`;

  const registerDto = await createValidSubmitDTO(RegisterEthUserDto, { publicKey: otherUser.publicKey });
  registerDto.sign(admin.privateKey);

  const getProfileDto = await createValidDTO(GetPublicKeyDto, { user: otherUserAlias });

  // initially the key is missing
  const noKeyResponse1 = await client.evaluateTransaction("GetPublicKey", getProfileDto);
  expect(noKeyResponse1).toEqual(transactionErrorKey("PK_NOT_FOUND")); // initially the key is missing

  // When
  const registerEvaluateResponse = await client.evaluateTransaction("RegisterEthUser", registerDto);

  // Then
  expect(registerEvaluateResponse).toEqual(transactionSuccess()); // evaluate does not change the state

  // the key is still missing
  const noKeyResponse2 = await client.evaluateTransaction("GetPublicKey", getProfileDto);
  expect(noKeyResponse2).toEqual(transactionErrorKey("PK_NOT_FOUND")); // the key is still missing
  // TODO verify if call history is skipped
});

it.skip("should support key collision validation", async () => {
  // Given
  const transactionDelayMs = 100;
  const client1 = createClient(chaincodeIndexJs, transactionDelayMs);
  const client2 = createClient(chaincodeIndexJs, transactionDelayMs);

  const otherUser = signatures.genKeyPair();
  const registerDto = await createValidSubmitDTO(RegisterEthUserDto, { publicKey: otherUser.publicKey });
  registerDto.sign(admin.privateKey);

  // When
  const parallelCalls = await Promise.all([
    client1.submitTransaction("RegisterEthUser", registerDto),
    client2.submitTransaction("RegisterEthUser", registerDto)
  ]);

  // Then
  expect(parallelCalls).toEqual([transactionSuccess(), "MVCC_CONFLICT"]); // change the last value

  // Set transaction delay, and call two conflicting transactions in parallel (either the same client or different client)
  throw new Error("Not implemented");
});

it.skip("should support phantom read collision validation", async () => {
  // Set transaction delay, and call two conflicting transactions in parallel (either the same client or different client)
  throw new Error("Not implemented");
});

function createClient(chaincodeIndexJs: string, transactionDelayMs = 0) {
  const contractName = "PublicKeyContract";
  return new MockedChaincodeClientBuilder({
    mockedChaincodeDir: chaincodeIndexJs,
    orgMsp: "CuratorOrg"
  })
    .forContract({
      channel: "mychannel",
      chaincode: "mychaincode",
      contract: contractName
    })
    .withTransactionDelay(transactionDelayMs);
}

async function ensureChaincode(): Promise<string> {
  const tmpdir = os.tmpdir();
  const chaincodeDir = "test-chaincode";
  const chaincodePackageJsonPath = path.join(tmpdir, chaincodeDir, "package.json");

  function chaincodeIndexJsPath() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const chaincodePackageJson = require(chaincodePackageJsonPath) as { main: string };
    const chaincodeIndexJsPath = path.join(tmpdir, chaincodeDir, chaincodePackageJson.main);
    return chaincodeIndexJsPath;
  }

  if (fs.existsSync(chaincodePackageJsonPath)) {
    return chaincodeIndexJsPath();
  }

  const command = `cd "${tmpdir}" && \
    npm i -g @gala-chain/cli && \
    galachain --version && \
    galachain init "${chaincodeDir}" && \
    cd "${chaincodeDir}" && \
    npm install && \
    npm run build`;

  execSync(command, { stdio: "inherit" });

  if (!fs.existsSync(chaincodePackageJsonPath)) {
    throw new Error("Failed to create chaincode at " + chaincodePackageJsonPath);
  }

  return chaincodeIndexJsPath();
}
