**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > ChainCallDTO

# Class: ChainCallDTO

## Contents

- [Extended By](ChainCallDTO.md#extended-by)
- [Constructors](ChainCallDTO.md#constructors)
  - [new ChainCallDTO()](ChainCallDTO.md#new-chaincalldto)
- [Properties](ChainCallDTO.md#properties)
  - [signature](ChainCallDTO.md#signature)
  - [signerPublicKey](ChainCallDTO.md#signerpublickey)
  - [trace](ChainCallDTO.md#trace)
  - [uniqueKey](ChainCallDTO.md#uniquekey)
  - [ENCODING](ChainCallDTO.md#encoding)
- [Methods](ChainCallDTO.md#methods)
  - [isSignatureValid()](ChainCallDTO.md#issignaturevalid)
  - [serialize()](ChainCallDTO.md#serialize)
  - [sign()](ChainCallDTO.md#sign)
  - [signed()](ChainCallDTO.md#signed)
  - [validate()](ChainCallDTO.md#validate)
  - [validateOrReject()](ChainCallDTO.md#validateorreject)
  - [deserialize()](ChainCallDTO.md#deserialize)

## Extended By

- [`GetObjectDto`](GetObjectDto.md)
- [`GetObjectHistoryDto`](GetObjectHistoryDto.md)
- [`RegisterUserDto`](RegisterUserDto.md)
- [`RegisterEthUserDto`](RegisterEthUserDto.md)
- [`UpdatePublicKeyDto`](UpdatePublicKeyDto.md)
- [`GetPublicKeyDto`](GetPublicKeyDto.md)
- [`GetMyProfileDto`](GetMyProfileDto.md)
- [`TokenInstanceKey`](TokenInstanceKey.md)
- [`TokenInstanceQuantity`](TokenInstanceQuantity.md)
- [`TokenInstanceQueryKey`](TokenInstanceQueryKey.md)
- [`TokenClassKey`](TokenClassKey.md)
- [`FetchTokenClassesDto`](FetchTokenClassesDto.md)
- [`FetchTokenClassesWithPaginationDto`](FetchTokenClassesWithPaginationDto.md)
- [`FetchTokenClassesResponse`](FetchTokenClassesResponse.md)
- [`FetchTokenInstancesDto`](FetchTokenInstancesDto.md)
- [`CreateTokenClassDto`](CreateTokenClassDto.md)
- [`UpdateTokenClassDto`](UpdateTokenClassDto.md)
- [`FetchBalancesDto`](FetchBalancesDto.md)
- [`FetchBalancesWithPaginationDto`](FetchBalancesWithPaginationDto.md)
- [`TokenBalanceWithMetadata`](TokenBalanceWithMetadata.md)
- [`FetchBalancesWithTokenMetadataResponse`](FetchBalancesWithTokenMetadataResponse.md)
- [`TransferTokenDto`](TransferTokenDto.md)
- [`AllowanceKey`](AllowanceKey.md)
- [`FetchAllowancesDto`](FetchAllowancesDto.md)
- [`FetchAllowancesLegacyDto`](FetchAllowancesLegacyDto.md)
- [`FetchAllowancesResponse`](FetchAllowancesResponse.md)
- [`DeleteAllowancesDto`](DeleteAllowancesDto.md)
- [`GrantAllowanceDto`](GrantAllowanceDto.md)
- [`HighThroughputGrantAllowanceDto`](HighThroughputGrantAllowanceDto.md)
- [`FulfillMintAllowanceDto`](FulfillMintAllowanceDto.md)
- [`FullAllowanceCheckDto`](FullAllowanceCheckDto.md)
- [`FullAllowanceCheckResDto`](FullAllowanceCheckResDto.md)
- [`RefreshAllowanceDto`](RefreshAllowanceDto.md)
- [`RefreshAllowancesDto`](RefreshAllowancesDto.md)
- [`LockTokenDto`](LockTokenDto.md)
- [`LockTokensDto`](LockTokensDto.md)
- [`UnlockTokenDto`](UnlockTokenDto.md)
- [`UnlockTokensDto`](UnlockTokensDto.md)
- [`ReleaseTokenDto`](ReleaseTokenDto.md)
- [`UseTokenDto`](UseTokenDto.md)
- [`FetchBurnsDto`](FetchBurnsDto.md)
- [`BurnTokensDto`](BurnTokensDto.md)
- [`BurnAndMintDto`](BurnAndMintDto.md)
- [`FetchBurnCountersWithPaginationDto`](FetchBurnCountersWithPaginationDto.md)
- [`FetchBurnCountersResponse`](FetchBurnCountersResponse.md)
- [`TokenBurnCounterCompositeKeyDto`](TokenBurnCounterCompositeKeyDto.md)
- [`MintTokenDto`](MintTokenDto.md)
- [`MintTokenWithAllowanceDto`](MintTokenWithAllowanceDto.md)
- [`BatchMintTokenDto`](BatchMintTokenDto.md)
- [`HighThroughputMintTokenDto`](HighThroughputMintTokenDto.md)
- [`FulfillMintDto`](FulfillMintDto.md)
- [`FetchMintRequestsDto`](FetchMintRequestsDto.md)
- [`FetchTokenSupplyDto`](FetchTokenSupplyDto.md)
- [`FetchTokenSupplyResponse`](FetchTokenSupplyResponse.md)
- [`PatchMintAllowanceRequestDto`](PatchMintAllowanceRequestDto.md)
- [`PatchMintRequestDto`](PatchMintRequestDto.md)

## Constructors

### new ChainCallDTO()

> **new ChainCallDTO**(): [`ChainCallDTO`](ChainCallDTO.md)

## Properties

### signature

> **signature**?: `string`

#### Source

[chain-api/src/types/dtos.ts:134](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L134)

***

### signerPublicKey

> **signerPublicKey**?: `string`

#### Source

[chain-api/src/types/dtos.ts:143](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L143)

***

### trace

> **trace**?: [`TraceContext`](../interfaces/TraceContext.md)

#### Source

[chain-api/src/types/dtos.ts:99](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L99)

***

### uniqueKey

> **uniqueKey**?: `string`

#### Source

[chain-api/src/types/dtos.ts:114](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L114)

***

### ENCODING

> **`static`** **`readonly`** **ENCODING**: `"base64"` = `"base64"`

#### Source

[chain-api/src/types/dtos.ts:100](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L100)

## Methods

### isSignatureValid()

> **isSignatureValid**(`publicKey`): `boolean`

#### Parameters

▪ **publicKey**: `string`

#### Source

[chain-api/src/types/dtos.ts:185](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L185)

***

### serialize()

> **serialize**(): `string`

#### Source

[chain-api/src/types/dtos.ts:157](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L157)

***

### sign()

> **sign**(`privateKey`, `useDer`): `void`

#### Parameters

▪ **privateKey**: `string`

▪ **useDer**: `boolean`= `false`

#### Source

[chain-api/src/types/dtos.ts:168](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L168)

***

### signed()

> **signed**(`privateKey`, `useDer`): [`ChainCallDTO`](ChainCallDTO.md)

Creates a signed copy of current object.

#### Parameters

▪ **privateKey**: `string`

▪ **useDer**: `boolean`= `false`

#### Source

[chain-api/src/types/dtos.ts:179](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L179)

***

### validate()

> **validate**(): `Promise`\<`ValidationError`[]\>

#### Source

[chain-api/src/types/dtos.ts:145](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L145)

***

### validateOrReject()

> **validateOrReject**(): `Promise`\<`void`\>

#### Source

[chain-api/src/types/dtos.ts:149](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L149)

***

### deserialize()

> **`static`** **deserialize**\<`T`\>(`constructor`, `object`): `T`

#### Type parameters

▪ **T**

#### Parameters

▪ **constructor**: [`ClassConstructor`](../interfaces/ClassConstructor.md)\<[`Inferred`](../type-aliases/Inferred.md)\<`T`, [`ChainCallDTO`](ChainCallDTO.md)\>\>

▪ **object**: `string` \| `Record`\<`string`, `unknown`\> \| `Record`\<`string`, `unknown`\>[]

#### Source

[chain-api/src/types/dtos.ts:161](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L161)
