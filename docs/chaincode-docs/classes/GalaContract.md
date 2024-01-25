**@gala-chain/chaincode** ∙ [API](../exports.md)

***

[API](../exports.md) > GalaContract

# Class: `abstract` GalaContract

## Contents

- [Extends](GalaContract.md#extends)
- [Constructors](GalaContract.md#constructors)
  - [new GalaContract(name, version)](GalaContract.md#new-galacontractname-version)
- [Properties](GalaContract.md#properties)
  - [version](GalaContract.md#version)
- [Methods](GalaContract.md#methods)
  - [GetChaincodeVersion()](GalaContract.md#getchaincodeversion)
  - [GetContractAPI()](GalaContract.md#getcontractapi)
  - [GetObjectByKey()](GalaContract.md#getobjectbykey)
  - [GetObjectHistory()](GalaContract.md#getobjecthistory)
  - [afterTransaction()](GalaContract.md#aftertransaction)
  - [aroundTransaction()](GalaContract.md#aroundtransaction)
  - [beforeTransaction()](GalaContract.md#beforetransaction)
  - [createContext()](GalaContract.md#createcontext)
  - [getName()](GalaContract.md#getname)
  - [getVersion()](GalaContract.md#getversion)
  - [unknownTransaction()](GalaContract.md#unknowntransaction)
  - [\_isContract()](GalaContract.md#iscontract)

## Extends

- `Contract`

## Constructors

### new GalaContract(name, version)

> **new GalaContract**(`name`, `version`): [`GalaContract`](GalaContract.md)

#### Parameters

▪ **name**: `string`

Contract name

▪ **version**: `string`

Contract version. The actual value should be defined in the child
   * class, and should be taken from package.json. If you extend contract class
   * that extends GalaContract, you should also override version.

#### Overrides

Contract.constructor

#### Source

[chaincode/src/contracts/GalaContract.ts:37](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/contracts/GalaContract.ts#L37)

## Properties

### version

> **`private`** **`readonly`** **version**: `string`

Contract version. The actual value should be defined in the child
   * class, and should be taken from package.json. If you extend contract class
   * that extends GalaContract, you should also override version.

#### Source

[chaincode/src/contracts/GalaContract.ts:39](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/contracts/GalaContract.ts#L39)

## Methods

### GetChaincodeVersion()

> **GetChaincodeVersion**(`ctx`): `Promise`\<`GalaChainResponse`\<`string`\>\>

#### Parameters

▪ **ctx**: [`GalaChainContext`](GalaChainContext.md)

#### Source

[chaincode/src/contracts/GalaContract.ts:84](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/contracts/GalaContract.ts#L84)

***

### GetContractAPI()

> **GetContractAPI**(`ctx`): `Promise`\<`GalaChainResponse`\<`ContractAPI`\>\>

#### Parameters

▪ **ctx**: [`GalaChainContext`](GalaChainContext.md)

#### Source

[chaincode/src/contracts/GalaContract.ts:93](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/contracts/GalaContract.ts#L93)

***

### GetObjectByKey()

> **GetObjectByKey**(`ctx`, `dto`): `Promise`\<`GalaChainResponse`\<`Record`\<`string`, `unknown`\>\>\>

#### Parameters

▪ **ctx**: [`GalaChainContext`](GalaChainContext.md)

▪ **dto**: `GetObjectDto`

#### Source

[chaincode/src/contracts/GalaContract.ts:104](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/contracts/GalaContract.ts#L104)

***

### GetObjectHistory()

> **GetObjectHistory**(`ctx`, `dto`): `Promise`\<`GalaChainResponse`\<`Record`\<`string`, `unknown`\>\>\>

#### Parameters

▪ **ctx**: [`GalaChainContext`](GalaChainContext.md)

▪ **dto**: `GetObjectHistoryDto`

#### Source

[chaincode/src/contracts/GalaContract.ts:116](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/contracts/GalaContract.ts#L116)

***

### afterTransaction()

> **afterTransaction**(`ctx`, `result`): `Promise`\<`void`\>

#### Parameters

▪ **ctx**: [`GalaChainContext`](GalaChainContext.md)

▪ **result**: `unknown`

#### Overrides

Contract.afterTransaction

#### Source

[chaincode/src/contracts/GalaContract.ts:62](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/contracts/GalaContract.ts#L62)

***

### aroundTransaction()

> **aroundTransaction**(`ctx`, `fn`, `parameters`): `Promise`\<`void`\>

#### Parameters

▪ **ctx**: [`GalaChainContext`](GalaChainContext.md)

▪ **fn**: `Function`

▪ **parameters**: `unknown`

#### Overrides

Contract.aroundTransaction

#### Source

[chaincode/src/contracts/GalaContract.ts:57](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/contracts/GalaContract.ts#L57)

***

### beforeTransaction()

> **beforeTransaction**(`ctx`): `Promise`\<`void`\>

#### Parameters

▪ **ctx**: [`GalaChainContext`](GalaChainContext.md)

#### Overrides

Contract.beforeTransaction

#### Source

[chaincode/src/contracts/GalaContract.ts:52](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/contracts/GalaContract.ts#L52)

***

### createContext()

> **createContext**(): [`GalaChainContext`](GalaChainContext.md)

#### Overrides

Contract.createContext

#### Source

[chaincode/src/contracts/GalaContract.ts:48](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/contracts/GalaContract.ts#L48)

***

### getName()

> **getName**(): `string`

#### Inherited from

Contract.getName

#### Source

node\_modules/fabric-contract-api/types/index.d.ts:33

***

### getVersion()

> **getVersion**(): `string`

#### Source

[chaincode/src/contracts/GalaContract.ts:44](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/contracts/GalaContract.ts#L44)

***

### unknownTransaction()

> **unknownTransaction**(`ctx`): `Promise`\<`void`\>

#### Parameters

▪ **ctx**: `Context`

#### Inherited from

Contract.unknownTransaction

#### Source

node\_modules/fabric-contract-api/types/index.d.ts:30

***

### \_isContract()

> **`static`** **\_isContract**(): `boolean`

#### Inherited from

Contract.\_isContract

#### Source

node\_modules/fabric-contract-api/types/index.d.ts:24
