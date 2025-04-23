# Testing your chaincode

The GalaChain SDK includes a comprehensive set of tools in the `@gala-chain/test` package to facilitate the testing of your chaincode.
This package supports both unit testing for individual contracts and integration/end-to-end testing for running networks.

## Unit testing

The `@gala-chain/test` package offers utilities designed for straightforward unit testing of your chaincode.
The recommended library for tests is [Jest](https://jestjs.io/).

### Writing unit tests

Consider a contract `AppleContract` with the following methods:

```typescript
export class AppleContract extends GalaContract {
  public async PlantTree(ctx: GalaChainContext, dto: AppleTreeDto): Promise<void> { ... }
  public async PickApple(ctx: GalaChainContext, dto: PickAppleDto): Promise<void> { ... }
}
```

Let's create tests for the following scenarios:

1. `AppleContract` should allow to plant a tree.
2. `AppleContract` should fail to plant a tree if tree already exists.
3. `AppleContract` should allow to pick an apple.

Note: `AppleContract` with the referenced implementation and all relevant tests are available in chaincode template.
You can follow the instructions in [Getting started](./getting-started.md) to create a new chaincode project with `AppleContract` included.

#### Test 1. `AppleContract` should allow to plant a tree

This test ensures that the `AppleContract` allows users to successfully plant a new apple tree.
It validates the contract's behavior during the tree planting process.

```typescript
import { fixture, transactionSuccess, writesMap } from "@gala-chain/test";

import { AppleTree, AppleTreeDto, Variety } from "../apples";
import { AppleContract } from "./AppleContract";

it("should allow to plant a tree", async () => {
  // Given
  const { contract, ctx, writes } = fixture(AppleContract);
  const dto = new AppleTreeDto(Variety.GALA, 1);
  const expectedTree = new AppleTree(ctx.callingUser, dto.variety, dto.index, ctx.txUnixTime);

  // When
  const response = await contract.PlantTree(ctx, dto);

  // Then
  expect(response).toEqual(transactionSuccess());
  expect(writes).toEqual(writesMap(expectedTree));
});
```

In this test, we set up the initial environment using the `fixture` utility from `@gala-chain/test`.
The `fixture` contains:

- `contract` -- instance of the `AppleContract` class,
- `ctx` -- test chaincode context,
- `writes` -- object capturing changes to the blockchain state.

Also, we define the `AppleTreeDto` instance containing details about the apple tree to be planted, and the `expectedTree` instance containing the expected object to be written to the blockchain state.

The primary action involves invoking the `PlantTree` method on the `contract` instance.

Then, we assert that the response from planting the tree aligns with the expected success result with `transactionSuccess` matcher from `@gala-chain/test`.
Furthermore, we verify that the changes to the blockchain state (`writes`) match the expected modifications.
Since `writes` is a map of key-value pairs, we use the `writesMap` utility from `@gala-chain/test` to get a key-value representation of the `expectedTree` instance.

#### Test 2. `AppleContract` should fail to plant a tree if tree already exists

In this test case, we aim to verify the behavior of the AppleContract when attempting to plant a new apple tree that already exists.
In our case a tree is considered to exist if it has the same `variety` and `index` as is planted by the same user.

```typescript
import { ChainUser } from "@gala-chain/api";
import { fixture, transactionErrorMessageContains } from "@gala-chain/test";

import { AppleTree, AppleTreeDto, Variety } from "../apples";
import { AppleContract } from "./AppleContract";

it("should fail to plant a tree if tree already exists", async () => {
  // Given
  const user = ChainUser.withRandomKeys();

  const { contract, ctx, writes } = fixture(AppleContract)
    .callingUser(user)
    .savedState(new AppleTree(user.identityKey, Variety.GOLDEN_DELICIOUS, 1, 0));

  // When
  const response = await contract.PlantTree(ctx, new AppleTreeDto(Variety.GOLDEN_DELICIOUS, 1));

  // Then
  expect(response).toEqual(transactionErrorMessageContains("Tree already exists"));
  expect(writes).toEqual({});
});
```

In this test case, we also use the `fixture` utility from `@gala-chain/test` to set up the initial environment.
However, we use the `callingUser` method to specify the user who will invoke the contract method, and we use the `savedState` method to specify the initial state of the blockchain.
Also, the saved `AppleTree` instance is marked to be planted by the user who invokes the contract method (`user.identityKey` is the same as `ctx.callingUser` in this setup).

This way calling `PlantTree` method with the same `variety` and `index` will result in an error.

During validation, we assert that the response from planting the tree contains the expected error message, and no changes to the blockchain state (`writes`) are made.
To assert the error we use the `transactionErrorMessageContains` matcher from `@gala-chain/test`.
Other useful matchers include `transactionError` (for providing an exact error object) and `transactionErrorKey` (for providing the error key).

#### Test 3. `AppleContract` should allow to pick an apple

In this test case, we aim to verify the behavior of the `AppleContract` when attempting to pick an apple from an existing apple tree.

```typescript
import { fixture, transactionSuccess, writesMap } from "@gala-chain/test";
import { plainToInstance } from "class-transformer";

import { AppleTree, PickAppleDto, Variety } from "../apples";
import { AppleContract } from "./AppleContract";

it("should allow to pick apples", async () => {
  // Given
  const twoYearsAgo = new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 365 * 2).getTime();
  const existingTree = new AppleTree("client|some-user", Variety.GALA, 1, twoYearsAgo);
  const { contract, ctx, writes } = fixture(AppleContract).savedState(existingTree);

  const dto = new PickAppleDto(existingTree.plantedBy, existingTree.variety, existingTree.index);

  // When
  const response = await contract.PickApple(ctx, dto);

  // Then
  expect(response).toEqual(transactionSuccess());
  expect(writes).toEqual(
    writesMap(
      plainToInstance(AppleTree, {
        ...existingTree,
        applesPicked: existingTree.applesPicked.plus(1)
      })
    )
  );
});
```

In our case a tree has apples if a given time passes.
That's why we start from a tree that was planted two years ago.

During validation, we assert that the response from picking an apple is successful, and the change to the blockchain state (`writes`) is overriding current apple tree with the updated picked apples count.

### Using `fixture` for regular functions

`fixture` can be used for regular functions as well, without the need to call contract methods directly.
However, the `ctx` parameter is tied to the contract, and you must provide any contract class, such as `AppleContract` or any class that extends `GalaContract` from the `@gala-chain/chaincode` package.

```typescript
import { GalaContract } from "@gala-chain/chaincode";
import { ChainUser } from "@gala-chain/api";
import { fixture, writesMap } from "@gala-chain/test";

import { AppleTree } from "./AppleTree";
import { AppleTreeDto, AppleTreesDto } from "./dtos";
import { plantTrees } from "./plantTrees";
import { Variety } from "./types";

class TestContract extends GalaContract {
  constructor() {
    super("TestContract", "0.0.1");
  }
}

it("should allow to plant trees", async () => {
  // Given
  const user = ChainUser.withRandomKeys();

  const { ctx, writes } = fixture(TestContract).callingUser(user);

  const dto = new AppleTreesDto([new AppleTreeDto(Variety.GALA, 1), new AppleTreeDto(Variety.MCINTOSH, 2)]);

  const expectedTrees = dto.trees.map(
    (t) => new AppleTree(user.identityKey, t.variety, t.index, ctx.txUnixTime)
  );

  // When
  const response = await plantTrees(ctx, dto);

  // Then
  expect(response).toEqual(expectedTrees);

  await ctx.stub.flushWrites();
  expect(writes).toEqual(writesMap(...expectedTrees));
});
```

Using `fixture` for regular functions is useful when you want to test the behavior of the function without the need to call the contract method.
However, if you want to verify writes, you need to explicitly call `contract.afterTransaction` or `ctx.stub.flushWrites` method.
This is required, because all writes actually are added to internal cache, and are executed after the contract method is successfully executed.

### Additional notes

#### Signatures

In most transactions, DTOs require a secp256k1 signature to verify the identity of the user invoking the contract method.
When using `fixture`, there's no need to provide a signature as it's handled automatically.

#### `beforeTransaction` and `afterTransaction`

In the context of testing contract methods with `fixture`, you don't need to manually call `contract.beforeTransaction` and `contract.afterTransaction` methods; they are invoked automatically.

## Integration testing

The `@gala-chain/test` package, combined with the `@gala-chain/client` package, provides utilities for integration testing your chaincode.
The primary objective of integration or end-to-end tests is to call transactions on the actual Hyperledger Fabric network and verify the results.

The recommended library for tests is [Jest](https://jestjs.io/).

### Writing integration tests

Assume you have a contract `AppleContract` with the following methods:

```typescript
export class AppleContract extends GalaContract {
  public async PlantTrees(ctx: GalaChainContext, dto: AppleTreesDto): Promise<void> { ... }
  public async FetchTrees(ctx: GalaChainContext, dto: FetchTreesDto): Promise<PagedTreesDto> { ... }
  public async PickApple(ctx: GalaChainContext, dto: PickAppleDto): Promise<void> { ... }
}
```

Let's write tests for the following scenarios:

1. Plant a bunch of trees
2. Fetch GALA trees planted by a user
3. Fail to pick a GOLDEN_DELICIOUS apple because tree is too young

Note: `AppleContract` with the referenced implementation and all relevant tests (file: `e2e/apples.spec.ts`) are available in chaincode template.

#### Setup

Before writing integration tests, ensure you have a running GalaChain network.
You can use the `npm run network:start` command provided by the chaincode template to start a local network in dev mode with hot-reload enabled.

Integration tests are executed against the running network, which is not recreated after each test.
To make tests independent, you may need to randomize test data or clean up the data on the chain after tests.

In our case for apples, we use random users defined at the test suite level to create different users for each run, ensuring test suite independence.
However, each test in the suite uses the same user and is not independent.
Thus, we use scenario-like testing in the apples test suite, and each test is dependent on the previous one.

Also, since we are using the running network, we need a client to interact with the network.
It needs to be connected to the network, anf it needs to be disconnected after the tests are finished.

Here is an example of the test setup:

```typescript
import { AdminChainClients, TestClients, transactionErrorKey, transactionSuccess, } from "@gala-chain/test";
import { ChainUser, GalaChainResponse } from "@gala-chain/api";
import { ChainClient } from "@gala-chain/client";
import { AppleTreeDto, AppleTreesDto, FetchTreesDto, PagedTreesDto, PickAppleDto, Variety } from "../src/apples";

describe("Apple trees", () => {
  const appleContractConfig = {apples: {name: "AppleContract", api: appleContractAPI}};
  let client: AdminChainClients<typeof appleContractConfig>;
  let user: ChainUser;

  beforeAll(async () => {
    client = await TestClients.createForAdmin(appleContractConfig);
    user = await client.createRegisteredUser();
  });

  afterAll(async () => {
    await client.disconnect();
  });
  ...
```

#### Optional setup -- custom API

By default `client` is not aware of your chaincode and types, providing only generic methods for submitting or evaluating transactions:

```typescript
submitTransaction(method: string): Promise<GalaChainResponse<unknown>>;
submitTransaction(method: string, dto: ChainCallDTO): Promise<GalaChainResponse<unknown>>;
submitTransaction<T>(method: string, resp: ClassType<Inferred<T>>): Promise<GalaChainResponse<T>>;
submitTransaction<T>(method: string, dto: ChainCallDTO, resp: ClassType<Inferred<T>>): Promise<GalaChainResponse<T>>;

evaluateTransaction(method: string): Promise<GalaChainResponse<unknown>>;
evaluateTransaction(method: string, dto: ChainCallDTO): Promise<GalaChainResponse<unknown>>;
evaluateTransaction<T>(method: string, resp: ClassType<Inferred<T>>): Promise<GalaChainResponse<T>>;
evaluateTransaction<T>(method: string, dto: ChainCallDTO, resp: ClassType<Inferred<T>>): Promise<GalaChainResponse<T>>;
```

They are generic, and you need to provide a method name, and optionally a DTO and response type to deserialize the response to a proper type.
But you can define a custom API, that will be aware of your chaincode and types.

If you choose not to use a custom API, you can create a test client as follows:

```typescript
  const appleContractConfig = {apples: "AppleContract"};
  let client: AdminChainClients<typeof appleContractConfig>;
  ...
  beforeAll(async () => {
    client = await TestClients.createForAdmin(appleContractConfig);
    ...
```

This way you will be able to use only the generic methods to call chaincodes: `client.apples.evaluateTransaction(...)` or `client.apples.submitTransaction(...)`.

However, defining a custom API offers type-safe calls, as demonstrated in the apples test suite.
You can define it as follows:

```typescript
interface AppleContractAPI {
  PlantTrees(dto: AppleTreesDto): Promise<GalaChainResponse<void>>;
  FetchTrees(dto: FetchTreesDto): Promise<GalaChainResponse<PagedTreesDto>>;
}

function appleContractAPI(client: ChainClient): AppleContractAPI {
  return {
    PlantTrees(dto: AppleTreesDto) {
      return client.submitTransaction("PlantTrees", dto) as Promise<GalaChainResponse<void>>;
    },
    FetchTrees(dto: FetchTreesDto) {
      return client.evaluateTransaction("FetchTrees", dto, PagedTreesDto);
    }
  };
}
```

And provide it for client creation:

```typescript
  const appleContractConfig = {apples: {name: "AppleContract", api: appleContractAPI}};
  let client: AdminChainClients<typeof appleContractConfig>;
  ...
  beforeAll(async () => {
    client = await TestClients.createForAdmin(appleContractConfig);
    ...
```

And it allows you to use type-safe calls, defined in the API, like `client.apples.PlantTrees(...)` or `client.apples.FetchTrees(...)`.

#### Test 1. Plant a bunch of trees

```typescript
test("Plant a bunch of trees", async () => {
  // Given
  const dto = new AppleTreesDto([
    new AppleTreeDto(Variety.GALA, 1),
    new AppleTreeDto(Variety.GOLDEN_DELICIOUS, 2),
    new AppleTreeDto(Variety.GALA, 3)
  ]).signed(user.privateKey, false);

  // When
  const response = await client.apples.PlantTrees(dto);

  // Then
  expect(response).toEqual(transactionSuccess());
});
```

In this test case, we create a DTO with three trees to plant.
We sign the DTO with the user's private key to prove the identity of the user.
This is required, in contrast to unit tests.

Then we call `PlantTrees` method, defined in our custom API, and we assert that the response is successful.

As a result the test writes three trees to the blockchain, planted by the user.
We will use them in the next test.

#### Test 2. Fetch GALA trees planted by a user

```typescript
test("Fetch GALA trees planted by a user", async () => {
  // Given
  const dto = new FetchTreesDto(user.identityKey, Variety.GALA).signed(user.privateKey, false);

  // When
  const response = await client.apples.FetchTrees(dto);

  // Then
  expect(response).toEqual(
    transactionSuccess({
      trees: [
        expect.objectContaining({ plantedBy: user.identityKey, variety: Variety.GALA, index: 1 }),
        expect.objectContaining({ plantedBy: user.identityKey, variety: Variety.GALA, index: 3 })
      ],
      bookmark: ""
    })
  );
});
```

In the previous test, we planted three trees, two of them are GALA.
In this test, we fetch all GALA trees planted by the user.

The response contains two trees, planted by the user, and the bookmark for fetching next page (though in this case, it's empty).

#### Test 3. Fail to pick a GOLDEN_DELICIOUS apple because tree is too young

```typescript
test("Fail to pick a GOLDEN_DELICIOUS apple because tree is too young", async () => {
  // Given
  const dto = new PickAppleDto(user.identityKey, Variety.GOLDEN_DELICIOUS, 2).signed(user.privateKey, false);

  // When
  const response = await client.apples.PickApple(dto);

  // Then
  expect(response).toEqual(transactionErrorKey("NO_APPLES_LEFT"));
});
```

In this test case, we try to pick an apple from the tree that was planted in the first test.
However, the tree is too young, so we expect an error.

These examples provide a comprehensive guide for unit and integration testing of GalaChain smart contracts using the `@gala-chain/test` package.
Adjust and expand the provided code snippets based on your specific contract implementations and testing requirements.
