**@gala-chain/chaincode** ∙ [API](../exports.md)

***

[API](../exports.md) > PublicKeyContract

# Class: PublicKeyContract

## Contents

- [Extends](PublicKeyContract.md#extends)
- [Constructors](PublicKeyContract.md#constructors)
  - [new PublicKeyContract()](PublicKeyContract.md#new-publickeycontract)
- [Methods](PublicKeyContract.md#methods)
  - [GetChaincodeVersion()](PublicKeyContract.md#getchaincodeversion)
  - [GetContractAPI()](PublicKeyContract.md#getcontractapi)
  - [GetMyProfile()](PublicKeyContract.md#getmyprofile)
  - [GetObjectByKey()](PublicKeyContract.md#getobjectbykey)
  - [GetObjectHistory()](PublicKeyContract.md#getobjecthistory)
  - [GetPublicKey()](PublicKeyContract.md#getpublickey)
  - [RegisterEthUser()](PublicKeyContract.md#registerethuser)
  - [RegisterUser()](PublicKeyContract.md#registeruser)
  - [UpdatePublicKey()](PublicKeyContract.md#updatepublickey)
  - [VerifySignature()](PublicKeyContract.md#verifysignature)
  - [afterTransaction()](PublicKeyContract.md#aftertransaction)
  - [aroundTransaction()](PublicKeyContract.md#aroundtransaction)
  - [beforeTransaction()](PublicKeyContract.md#beforetransaction)
  - [createContext()](PublicKeyContract.md#createcontext)
  - [getName()](PublicKeyContract.md#getname)
  - [getVersion()](PublicKeyContract.md#getversion)
  - [registerUser()](PublicKeyContract.md#registeruser)
  - [unknownTransaction()](PublicKeyContract.md#unknowntransaction)
  - [\_isContract()](PublicKeyContract.md#iscontract)

## Extends

- [`GalaContract`](GalaContract.md)

## Constructors

### new PublicKeyContract()

> **new PublicKeyContract**(): [`PublicKeyContract`](PublicKeyContract.md)

#### Overrides

[`GalaContract`](GalaContract.md).[`constructor`](GalaContract.md#constructors)

#### Source

[chaincode/src/contracts/PublicKeyContract.ts:56](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/contracts/PublicKeyContract.ts#L56)

## Methods

### GetChaincodeVersion()

> **GetChaincodeVersion**(`ctx`): `Promise`\<`GalaChainResponse`\<`string`\>\>

#### Parameters

▪ **ctx**: [`GalaChainContext`](GalaChainContext.md)

#### Inherited from

[`GalaContract`](GalaContract.md).[`GetChaincodeVersion`](GalaContract.md#getchaincodeversion)

#### Source

[chaincode/src/contracts/GalaContract.ts:84](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/contracts/GalaContract.ts#L84)

***

### GetContractAPI()

> **GetContractAPI**(`ctx`): `Promise`\<`GalaChainResponse`\<`ContractAPI`\>\>

#### Parameters

▪ **ctx**: [`GalaChainContext`](GalaChainContext.md)

#### Inherited from

[`GalaContract`](GalaContract.md).[`GetContractAPI`](GalaContract.md#getcontractapi)

#### Source

[chaincode/src/contracts/GalaContract.ts:93](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/contracts/GalaContract.ts#L93)

***

### GetMyProfile()

> **GetMyProfile**(`ctx`, `dto`): `Promise`\<`GalaChainResponse`\<`UserProfile`\>\>

#### Parameters

▪ **ctx**: [`GalaChainContext`](GalaChainContext.md)

▪ **dto**: `GetMyProfileDto`

#### Source

[chaincode/src/contracts/PublicKeyContract.ts:99](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/contracts/PublicKeyContract.ts#L99)

***

### GetObjectByKey()

> **GetObjectByKey**(`ctx`, `dto`): `Promise`\<`GalaChainResponse`\<`Record`\<`string`, `unknown`\>\>\>

#### Parameters

▪ **ctx**: [`GalaChainContext`](GalaChainContext.md)

▪ **dto**: `GetObjectDto`

#### Inherited from

[`GalaContract`](GalaContract.md).[`GetObjectByKey`](GalaContract.md#getobjectbykey)

#### Source

[chaincode/src/contracts/GalaContract.ts:104](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/contracts/GalaContract.ts#L104)

***

### GetObjectHistory()

> **GetObjectHistory**(`ctx`, `dto`): `Promise`\<`GalaChainResponse`\<`Record`\<`string`, `unknown`\>\>\>

#### Parameters

▪ **ctx**: [`GalaChainContext`](GalaChainContext.md)

▪ **dto**: `GetObjectHistoryDto`

#### Inherited from

[`GalaContract`](GalaContract.md).[`GetObjectHistory`](GalaContract.md#getobjecthistory)

#### Source

[chaincode/src/contracts/GalaContract.ts:116](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/contracts/GalaContract.ts#L116)

***

### GetPublicKey()

> **GetPublicKey**(`ctx`, `dto`): `Promise`\<`GalaChainResponse`\<`PublicKey`\>\>

#### Parameters

▪ **ctx**: [`GalaChainContext`](GalaChainContext.md)

▪ **dto**: `GetPublicKeyDto`

#### Source

[chaincode/src/contracts/PublicKeyContract.ts:181](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/contracts/PublicKeyContract.ts#L181)

***

### RegisterEthUser()

> **RegisterEthUser**(`ctx`, `dto`): `Promise`\<`GalaChainResponse`\<`string`\>\>

#### Parameters

▪ **ctx**: [`GalaChainContext`](GalaChainContext.md)

▪ **dto**: `RegisterEthUserDto`

#### Source

[chaincode/src/contracts/PublicKeyContract.ts:150](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/contracts/PublicKeyContract.ts#L150)

***

### RegisterUser()

> **RegisterUser**(`ctx`, `dto`): `Promise`\<`GalaChainResponse`\<`string`\>\>

#### Parameters

▪ **ctx**: [`GalaChainContext`](GalaChainContext.md)

▪ **dto**: `RegisterUserDto`

#### Source

[chaincode/src/contracts/PublicKeyContract.ts:129](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/contracts/PublicKeyContract.ts#L129)

***

### UpdatePublicKey()

> **UpdatePublicKey**(`ctx`, `dto`): `Promise`\<`GalaChainResponse`\<`void`\>\>

#### Parameters

▪ **ctx**: [`GalaChainContext`](GalaChainContext.md)

▪ **dto**: `UpdatePublicKeyDto`

#### Source

[chaincode/src/contracts/PublicKeyContract.ts:167](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/contracts/PublicKeyContract.ts#L167)

***

### VerifySignature()

> **VerifySignature**(`ctx`, `dto`): `Promise`\<`GalaChainResponse`\<`void`\>\>

#### Parameters

▪ **ctx**: [`GalaChainContext`](GalaChainContext.md)

▪ **dto**: `ChainCallDTO`

#### Source

[chaincode/src/contracts/PublicKeyContract.ts:202](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/contracts/PublicKeyContract.ts#L202)

***

### afterTransaction()

> **afterTransaction**(`ctx`, `result`): `Promise`\<`void`\>

#### Parameters

▪ **ctx**: [`GalaChainContext`](GalaChainContext.md)

▪ **result**: `unknown`

#### Inherited from

[`GalaContract`](GalaContract.md).[`afterTransaction`](GalaContract.md#aftertransaction)

#### Source

[chaincode/src/contracts/GalaContract.ts:62](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/contracts/GalaContract.ts#L62)

***

### aroundTransaction()

> **aroundTransaction**(`ctx`, `fn`, `parameters`): `Promise`\<`void`\>

#### Parameters

▪ **ctx**: [`GalaChainContext`](GalaChainContext.md)

▪ **fn**: `Function`

▪ **parameters**: `unknown`

#### Inherited from

[`GalaContract`](GalaContract.md).[`aroundTransaction`](GalaContract.md#aroundtransaction)

#### Source

[chaincode/src/contracts/GalaContract.ts:57](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/contracts/GalaContract.ts#L57)

***

### beforeTransaction()

> **beforeTransaction**(`ctx`): `Promise`\<`void`\>

#### Parameters

▪ **ctx**: [`GalaChainContext`](GalaChainContext.md)

#### Inherited from

[`GalaContract`](GalaContract.md).[`beforeTransaction`](GalaContract.md#beforetransaction)

#### Source

[chaincode/src/contracts/GalaContract.ts:52](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/contracts/GalaContract.ts#L52)

***

### createContext()

> **createContext**(): [`GalaChainContext`](GalaChainContext.md)

#### Inherited from

[`GalaContract`](GalaContract.md).[`createContext`](GalaContract.md#createcontext)

#### Source

[chaincode/src/contracts/GalaContract.ts:48](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/contracts/GalaContract.ts#L48)

***

### getName()

> **getName**(): `string`

#### Inherited from

[`GalaContract`](GalaContract.md).[`getName`](GalaContract.md#getname)

#### Source

node\_modules/fabric-contract-api/types/index.d.ts:33

***

### getVersion()

> **getVersion**(): `string`

#### Inherited from

[`GalaContract`](GalaContract.md).[`getVersion`](GalaContract.md#getversion)

#### Source

[chaincode/src/contracts/GalaContract.ts:44](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/contracts/GalaContract.ts#L44)

***

### registerUser()

> **`private`** **registerUser**(`ctx`, `providedPkHex`, `ethAddress`, `userAlias`): `Promise`\<`GalaChainResponse`\<`string`\>\>

#### Parameters

▪ **ctx**: [`GalaChainContext`](GalaChainContext.md)

▪ **providedPkHex**: `string`

▪ **ethAddress**: `string`

▪ **userAlias**: `string`

#### Source

[chaincode/src/contracts/PublicKeyContract.ts:60](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/contracts/PublicKeyContract.ts#L60)

***

### unknownTransaction()

> **unknownTransaction**(`ctx`): `Promise`\<`void`\>

#### Parameters

▪ **ctx**: `Context`

#### Inherited from

[`GalaContract`](GalaContract.md).[`unknownTransaction`](GalaContract.md#unknowntransaction)

#### Source

node\_modules/fabric-contract-api/types/index.d.ts:30

***

### \_isContract()

> **`static`** **\_isContract**(): `boolean`

#### Inherited from

[`GalaContract`](GalaContract.md).[`_isContract`](GalaContract.md#iscontract)

#### Source

node\_modules/fabric-contract-api/types/index.d.ts:24
