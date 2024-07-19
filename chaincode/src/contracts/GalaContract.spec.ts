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
  ChainObject,
  DefaultError,
  DryRunDto,
  GalaChainResponse,
  GalaChainResponseType,
  GetObjectDto,
  createValidDTO
} from "@gala-chain/api";
import { transactionError, transactionSuccess, users } from "@gala-chain/test";
import { instanceToPlain } from "class-transformer";
import { Context } from "fabric-contract-api";
import { inspect } from "util";

import TestChaincode from "../__test__/TestChaincode";
import TestGalaContract, { Superhero, SuperheroDto, SuperheroQueryDto } from "../__test__/TestGalaContract";
import { GalaChainContext, createValidChainObject } from "../types";

/*
 * Test below verifies that the base class of TestGalaContract (i.e. GalaContract) provides stub to
 * handle transactionality in a way that when the method ends with error, no state is saved.
 */
describe("GalaContract transaction consistency", () => {
  let chaincode: TestChaincode;
  let contract: TestGalaContract;
  let originalCreateContext: typeof contract.createContext;
  let originalAfterTransaction: typeof contract.afterTransaction;

  beforeEach(() => {
    chaincode = new TestChaincode([TestGalaContract]);
    contract = chaincode.getContractInstance(TestGalaContract);
    originalCreateContext = contract.createContext.bind(contract);
    originalAfterTransaction = contract.afterTransaction.bind(contract);
  });

  it("should not save values on error", async () => {
    // Given
    const [key1, value1] = ["test-key-save", "robot"];
    const [key2, value2] = ["test-key-dont-save", "human"];

    // When
    const responseSuccess = await chaincode.invoke("TestGalaContract:Put", key1, value1);
    const responseError = await chaincode.invoke("TestGalaContract:ErrorAfterPut", key2, value2);

    // Then
    expect(responseSuccess).toEqual(transactionSuccess());
    expect(responseError).toEqual(transactionError());

    expect(await chaincode.invoke("TestGalaContract:Get", key1)).toEqual(transactionSuccess(value1));
    expect(await chaincode.invoke("TestGalaContract:Get", key2)).toEqual(transactionSuccess(""));
  });

  it("should fail and save values when createContext is altered (no proper stub prepared)", async () => {
    // Given
    contract.createContext = () => new Context() as unknown as GalaChainContext;

    const [key1, value1] = ["test-key-save", "robot"];
    const [key2, value2] = ["test-key-dont-save", "human"];

    // When
    const response1 = await chaincode
      .invoke("TestGalaContract:Put", key1, value1)
      .catch((e: Error) => e.message ?? e);
    const response2 = await chaincode
      .invoke("TestGalaContract:ErrorAfterPut", key2, value2)
      .catch((e: Error) => e.message ?? e);

    // Then
    expect(response1).toEqual("ctx.stub.flushWrites is not a function");
    expect(response2).toEqual(transactionError()); // original error

    contract.createContext = originalCreateContext;
    expect(await chaincode.invoke("TestGalaContract:Get", key1)).toEqual(transactionSuccess(value1));
    expect(await chaincode.invoke("TestGalaContract:Get", key2)).toEqual(transactionSuccess(value2));
  });

  it("should not save anything when afterTransaction is altered (no proper flushWrites called)", async () => {
    // Given
    contract.afterTransaction = () => new Promise((res) => res());

    const [key1, value1] = ["test-key-save", "robot"];
    const [key2, value2] = ["test-key-dont-save", "human"];

    // When
    const responseSuccess = await chaincode.invoke("TestGalaContract:Put", key1, value1);
    const responseError = await chaincode.invoke("TestGalaContract:ErrorAfterPut", key2, value2);

    // Then
    expect(responseSuccess).toEqual(transactionSuccess());
    expect(responseError).toEqual(transactionError());

    contract.afterTransaction = originalAfterTransaction;
    expect(await chaincode.invoke("TestGalaContract:Get", key1)).toEqual(transactionSuccess(""));
    expect(await chaincode.invoke("TestGalaContract:Get", key2)).toEqual(transactionSuccess(""));
  });

  it("should save everything when both createContext and afterTransaction is altered", async () => {
    // Given
    contract.createContext = () => new Context() as unknown as GalaChainContext;
    contract.afterTransaction = () => new Promise((res) => res());

    const [key1, value1] = ["test-key-save", "robot"];
    const [key2, value2] = ["test-key-dont-save", "human"];

    // When
    const responseSuccess = await chaincode.invoke("TestGalaContract:Put", key1, value1);
    const responseError = await chaincode.invoke("TestGalaContract:ErrorAfterPut", key2, value2);

    // Then
    expect(responseSuccess).toEqual(transactionSuccess());
    expect(responseError).toEqual(transactionError());

    contract.createContext = originalCreateContext;
    contract.afterTransaction = originalAfterTransaction;
    expect(await chaincode.invoke("TestGalaContract:Get", key1)).toEqual(transactionSuccess(value1));
    expect(await chaincode.invoke("TestGalaContract:Get", key2)).toEqual(transactionSuccess(value2));
  });
});

describe("GalaContract.GetObjectsByPartialCompositeKey", () => {
  const getTargetCompositeKey = (dto: SuperheroDto): string => {
    const separator = ChainObject.MIN_UNICODE_RUNE_VALUE;
    return `${separator}superhero${separator}${dto.name}${separator}`;
  };

  const createQueryDto = async (saveBeforeReturn: Array<SuperheroDto>): Promise<SuperheroQueryDto> =>
    createValidDTO(SuperheroQueryDto, {
      saveBeforeReturn: saveBeforeReturn
    });

  const createTestFixture = async () => {
    const chaincode = new TestChaincode([TestGalaContract]);

    const batman = SuperheroDto.create("Batman", 32);
    const penguin = SuperheroDto.create("Penguin", 55);
    const unsubmittedJoker = SuperheroDto.create("Joker", 44);

    expect(await chaincode.invoke("TestGalaContract:CreateSuperhero", batman.serialize())).toEqual(
      transactionSuccess()
    );
    expect(await chaincode.invoke("TestGalaContract:CreateSuperhero", penguin.serialize())).toEqual(
      transactionSuccess()
    );

    return {
      chaincode: chaincode,
      batman: batman,
      penguin: penguin,
      unsubmittedJoker: unsubmittedJoker,
      querySuperheroes: async (dto: SuperheroQueryDto) => {
        const resp = (await chaincode.invoke(
          "TestGalaContract:QuerySuperheroes",
          dto.serialize()
        )) as GalaChainResponse<Record<string, unknown>[]>;
        if (GalaChainResponse.isSuccess(resp)) {
          return ChainObject.deserialize<Array<Superhero>>(Superhero, resp.Data);
        } else {
          throw new DefaultError(inspect(resp));
        }
      }
    };
  };

  it("should get values from both state and cache", async () => {
    // Given
    const fixture = await createTestFixture();
    const queryDto = await createQueryDto([fixture.unsubmittedJoker]);

    // When
    const results = await fixture.querySuperheroes(queryDto);

    // Then
    expect(results.map((r) => r.getCompositeKey()).sort()).toEqual(
      [
        getTargetCompositeKey(fixture.batman),
        getTargetCompositeKey(fixture.penguin),
        getTargetCompositeKey(fixture.unsubmittedJoker)
      ].sort()
    );
  });

  it("should get values from both state and cache (and prefer updated values)", async () => {
    // Given
    const fixture = await createTestFixture();
    const batmanKey = getTargetCompositeKey(fixture.batman);
    const updatedBatman = await createValidDTO<SuperheroDto>(SuperheroDto, {
      ...fixture.batman,
      age: 999
    });

    const queryDto = await createQueryDto([fixture.unsubmittedJoker, updatedBatman]);

    // When
    const results = await fixture.querySuperheroes(queryDto);

    // Then
    expect(results.map((r) => r.getCompositeKey()).sort()).toEqual(
      [
        batmanKey,
        getTargetCompositeKey(fixture.penguin),
        getTargetCompositeKey(fixture.unsubmittedJoker)
      ].sort()
    );

    expect(results.find((r) => r.getCompositeKey() === batmanKey)?.age).toEqual(updatedBatman.age);
  });
});

describe("GalaContract.DryRun", () => {
  const callerPublicKey = process.env.DEV_ADMIN_PUBLIC_KEY as string;

  it("should support DryRun for submit operations", async () => {
    // Given
    const chaincode = new TestChaincode([TestGalaContract]);
    const method = "CreateSuperhero";
    const dto = SuperheroDto.create("Batman", 32);
    const superhero = await createValidChainObject(Superhero, dto);
    const dryRunDto = await createValidDTO(DryRunDto, { method, callerPublicKey, dto });

    // When
    const response = await chaincode.invoke("TestGalaContract:DryRun", dryRunDto);

    // Then
    expect(response).toEqual({
      Status: GalaChainResponseType.Success,
      Data: {
        response: { Status: GalaChainResponseType.Success },
        reads: {},
        writes: { [superhero.getCompositeKey()]: superhero.serialize() },
        deletes: {}
      }
    });
  });

  it("should support DryRun for evaluate operations (read existing object)", async () => {
    // Given
    const chaincode = new TestChaincode([TestGalaContract]);
    const batman = SuperheroDto.create("Batman", 32);
    const batmanKey = (await createValidChainObject(Superhero, batman)).getCompositeKey();
    await chaincode.invoke("TestGalaContract:CreateSuperhero", batman.serialize());

    const method = "GetObjectByKey";
    const dto = await createValidDTO(GetObjectDto, { objectId: batmanKey });
    const dryRunDto = await createValidDTO(DryRunDto, { method, callerPublicKey, dto });

    // When
    const response = await chaincode.invoke("TestGalaContract:DryRun", dryRunDto);

    // Then
    expect(response).toEqual({
      Status: GalaChainResponseType.Success,
      Data: {
        response: { Status: GalaChainResponseType.Success, Data: instanceToPlain(batman) },
        reads: { [batmanKey]: batman.serialize() },
        writes: {},
        deletes: {}
      }
    });
  });

  it("should support DryRun for operations with no dto", async () => {
    // Given
    const chaincode = new TestChaincode([TestGalaContract]);
    const dryRunDto = await createValidDTO(DryRunDto, { method: "GetContractVersion", callerPublicKey });

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const expectedVersion = require("../../package.json").version;

    // When
    const response = await chaincode.invoke("TestGalaContract:DryRun", dryRunDto);

    // Then
    expect(response).toEqual({
      Status: GalaChainResponseType.Success,
      Data: {
        response: { Status: GalaChainResponseType.Success, Data: expectedVersion },
        reads: {},
        writes: {},
        deletes: {}
      }
    });
  });

  it("should support DryRun for evaluate operations (read missing object)", async () => {
    // Given
    const chaincode = new TestChaincode([TestGalaContract]);
    const batman = SuperheroDto.create("Batman", 32);
    const batmanKey = (await createValidChainObject(Superhero, batman)).getCompositeKey();
    // no save
    // await chaincode.invoke("TestGalaContract:CreateSuperhero", batman.serialize());

    const method = "GetObjectByKey";
    const dto = await createValidDTO(GetObjectDto, { objectId: batmanKey });
    const dryRunDto = await createValidDTO(DryRunDto, { method, callerPublicKey, dto });

    // When
    const response = await chaincode.invoke("TestGalaContract:DryRun", dryRunDto);

    // Then
    expect(response).toEqual({
      Status: GalaChainResponseType.Success,
      Data: {
        response: {
          Status: GalaChainResponseType.Error,
          ErrorCode: 404,
          ErrorKey: "OBJECT_NOT_FOUND",
          ErrorPayload: { objectId: batmanKey },
          Message: `No object with id ${batmanKey} exists`
        },
        reads: { [batmanKey]: "" }, // empty string because object is missing
        writes: {},
        deletes: {}
      }
    });
  });

  it("should return success response with error on chaincode error", async () => {
    // Given
    const chaincode = new TestChaincode([TestGalaContract]);
    const method = "CreateSuperhero";
    const dto = SuperheroDto.create("Batman", -1); // invalid age
    const dryRunDto = await createValidDTO(DryRunDto, { method, callerPublicKey, dto });

    // When
    const response = await chaincode.invoke("TestGalaContract:DryRun", dryRunDto);

    // Then
    expect(response).toEqual({
      Status: GalaChainResponseType.Success,
      Data: {
        response: {
          Status: GalaChainResponseType.Error,
          ErrorCode: 400,
          ErrorKey: "DTO_VALIDATION_FAILED",
          ErrorPayload: ["isPositive: age must be a positive number"],
          Message: "DTO validation failed: (1) isPositive: age must be a positive number"
        },
        reads: {},
        writes: {},
        deletes: {}
      }
    });
  });

  it("should return error response on method not found", async () => {
    // Given
    const chaincode = new TestChaincode([TestGalaContract]);
    const method = "UnknownMethod";
    const dryRunDto = await createValidDTO(DryRunDto, { method, callerPublicKey, dto: new ChainCallDTO() });

    // When
    const response = await chaincode.invoke("TestGalaContract:DryRun", dryRunDto);

    // Then
    expect(response).toEqual({
      Status: GalaChainResponseType.Error,
      ErrorCode: 404,
      ErrorKey: "NOT_FOUND",
      Message:
        "Method UnknownMethod not found. Available methods: CreateSuperhero, DryRun, GetChaincodeVersion, GetContractAPI, GetContractVersion, GetObjectByKey, GetObjectHistory, QuerySuperheroes"
    });
  });

  it("should return error response if inner dto contains signature", async () => {
    // Given
    const chaincode = new TestChaincode([TestGalaContract]);
    const method = "CreateSuperhero";
    const dto = await createValidDTO(ChainCallDTO, { signature: "some-signature" });
    const dryRunDto = await createValidDTO(DryRunDto, { method, callerPublicKey, dto });

    // When
    const response = await chaincode.invoke("TestGalaContract:DryRun", dryRunDto);

    // Then
    expect(response).toEqual({
      Status: GalaChainResponseType.Error,
      ErrorCode: 400,
      ErrorKey: "VALIDATION_FAILED",
      Message: "The dto should have no signature for dry run execution"
    });
  });
});
