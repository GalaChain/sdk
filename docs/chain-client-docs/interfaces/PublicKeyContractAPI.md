**@gala-chain/client** ∙ [API](../exports.md)

***

[API](../exports.md) > PublicKeyContractAPI

# Interface: PublicKeyContractAPI

## Contents

- [Extends](PublicKeyContractAPI.md#extends)
- [Methods](PublicKeyContractAPI.md#methods)
  - [GetChaincodeVersion()](PublicKeyContractAPI.md#getchaincodeversion)
  - [GetContractAPI()](PublicKeyContractAPI.md#getcontractapi)
  - [GetMyProfile()](PublicKeyContractAPI.md#getmyprofile)
  - [GetObjectByKey()](PublicKeyContractAPI.md#getobjectbykey)
  - [GetObjectHistory()](PublicKeyContractAPI.md#getobjecthistory)
  - [GetPublicKey()](PublicKeyContractAPI.md#getpublickey)
  - [RegisterEthUser()](PublicKeyContractAPI.md#registerethuser)
  - [RegisterUser()](PublicKeyContractAPI.md#registeruser)
  - [UpdatePublicKey()](PublicKeyContractAPI.md#updatepublickey)

## Extends

- [`CommonContractAPI`](CommonContractAPI.md)

## Methods

### GetChaincodeVersion()

> **GetChaincodeVersion**(): `Promise`\<`GalaChainResponse`\<`string`\>\>

#### Inherited from

[`CommonContractAPI`](CommonContractAPI.md).[`GetChaincodeVersion`](CommonContractAPI.md#getchaincodeversion)

#### Source

[api/CommonContractAPI.ts:26](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/api/CommonContractAPI.ts#L26)

***

### GetContractAPI()

> **GetContractAPI**(): `Promise`\<`GalaChainResponse`\<`ContractAPI`\>\>

#### Inherited from

[`CommonContractAPI`](CommonContractAPI.md).[`GetContractAPI`](CommonContractAPI.md#getcontractapi)

#### Source

[api/CommonContractAPI.ts:27](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/api/CommonContractAPI.ts#L27)

***

### GetMyProfile()

> **GetMyProfile**(`dto`): `Promise`\<`GalaChainResponse`\<`UserProfile`\>\>

#### Parameters

▪ **dto**: `GetMyProfileDto`

#### Source

[api/PublicKeyContractAPI.ts:34](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/api/PublicKeyContractAPI.ts#L34)

***

### GetObjectByKey()

> **GetObjectByKey**(`key`): `Promise`\<`GalaChainResponse`\<`Record`\<`string`, `unknown`\>\>\>

#### Parameters

▪ **key**: `string`

#### Inherited from

[`CommonContractAPI`](CommonContractAPI.md).[`GetObjectByKey`](CommonContractAPI.md#getobjectbykey)

#### Source

[api/CommonContractAPI.ts:28](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/api/CommonContractAPI.ts#L28)

***

### GetObjectHistory()

> **GetObjectHistory**(`key`): `Promise`\<`GalaChainResponse`\<`Record`\<`string`, `unknown`\>\>\>

#### Parameters

▪ **key**: `string`

#### Inherited from

[`CommonContractAPI`](CommonContractAPI.md).[`GetObjectHistory`](CommonContractAPI.md#getobjecthistory)

#### Source

[api/CommonContractAPI.ts:29](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/api/CommonContractAPI.ts#L29)

***

### GetPublicKey()

> **GetPublicKey**(`user`?): `Promise`\<`GalaChainResponse`\<`PublicKey`\>\>

#### Parameters

▪ **user?**: `string` \| `GetPublicKeyDto`

#### Source

[api/PublicKeyContractAPI.ts:30](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/api/PublicKeyContractAPI.ts#L30)

***

### RegisterEthUser()

> **RegisterEthUser**(`dto`): `Promise`\<`GalaChainResponse`\<`string`\>\>

#### Parameters

▪ **dto**: `RegisterEthUserDto`

#### Source

[api/PublicKeyContractAPI.ts:33](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/api/PublicKeyContractAPI.ts#L33)

***

### RegisterUser()

> **RegisterUser**(`dto`): `Promise`\<`GalaChainResponse`\<`string`\>\>

#### Parameters

▪ **dto**: `RegisterUserDto`

#### Source

[api/PublicKeyContractAPI.ts:32](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/api/PublicKeyContractAPI.ts#L32)

***

### UpdatePublicKey()

> **UpdatePublicKey**(`dto`): `Promise`\<`GalaChainResponse`\<`void`\>\>

#### Parameters

▪ **dto**: `UpdatePublicKeyDto`

#### Source

[api/PublicKeyContractAPI.ts:31](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/api/PublicKeyContractAPI.ts#L31)
