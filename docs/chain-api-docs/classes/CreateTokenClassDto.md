**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > CreateTokenClassDto

# Class: CreateTokenClassDto

## Contents

- [Extends](CreateTokenClassDto.md#extends)
- [Constructors](CreateTokenClassDto.md#constructors)
  - [new CreateTokenClassDto()](CreateTokenClassDto.md#new-createtokenclassdto)
- [Properties](CreateTokenClassDto.md#properties)
  - [authorities](CreateTokenClassDto.md#authorities)
  - [contractAddress](CreateTokenClassDto.md#contractaddress)
  - [decimals](CreateTokenClassDto.md#decimals)
  - [description](CreateTokenClassDto.md#description)
  - [image](CreateTokenClassDto.md#image)
  - [isNonFungible](CreateTokenClassDto.md#isnonfungible)
  - [maxCapacity](CreateTokenClassDto.md#maxcapacity)
  - [maxSupply](CreateTokenClassDto.md#maxsupply)
  - [metadataAddress](CreateTokenClassDto.md#metadataaddress)
  - [name](CreateTokenClassDto.md#name)
  - [network](CreateTokenClassDto.md#network)
  - [rarity](CreateTokenClassDto.md#rarity)
  - [signature](CreateTokenClassDto.md#signature)
  - [signerPublicKey](CreateTokenClassDto.md#signerpublickey)
  - [symbol](CreateTokenClassDto.md#symbol)
  - [tokenClass](CreateTokenClassDto.md#tokenclass)
  - [totalBurned](CreateTokenClassDto.md#totalburned)
  - [totalMintAllowance](CreateTokenClassDto.md#totalmintallowance)
  - [totalSupply](CreateTokenClassDto.md#totalsupply)
  - [trace](CreateTokenClassDto.md#trace)
  - [uniqueKey](CreateTokenClassDto.md#uniquekey)
  - [DEFAULT\_DECIMALS](CreateTokenClassDto.md#default-decimals)
  - [DEFAULT\_MAX\_CAPACITY](CreateTokenClassDto.md#default-max-capacity)
  - [DEFAULT\_MAX\_SUPPLY](CreateTokenClassDto.md#default-max-supply)
  - [DEFAULT\_NETWORK](CreateTokenClassDto.md#default-network)
  - [ENCODING](CreateTokenClassDto.md#encoding)
  - [INITIAL\_MINT\_ALLOWANCE](CreateTokenClassDto.md#initial-mint-allowance)
  - [INITIAL\_TOTAL\_BURNED](CreateTokenClassDto.md#initial-total-burned)
  - [INITIAL\_TOTAL\_SUPPLY](CreateTokenClassDto.md#initial-total-supply)
- [Methods](CreateTokenClassDto.md#methods)
  - [isSignatureValid()](CreateTokenClassDto.md#issignaturevalid)
  - [serialize()](CreateTokenClassDto.md#serialize)
  - [sign()](CreateTokenClassDto.md#sign)
  - [signed()](CreateTokenClassDto.md#signed)
  - [validate()](CreateTokenClassDto.md#validate)
  - [validateOrReject()](CreateTokenClassDto.md#validateorreject)
  - [deserialize()](CreateTokenClassDto.md#deserialize)

## Extends

- [`ChainCallDTO`](ChainCallDTO.md)

## Constructors

### new CreateTokenClassDto()

> **new CreateTokenClassDto**(): [`CreateTokenClassDto`](CreateTokenClassDto.md)

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`constructor`](ChainCallDTO.md#constructors)

## Properties

### authorities

> **authorities**?: `string`[]

#### Source

[chain-api/src/types/token.ts:264](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L264)

***

### contractAddress

> **contractAddress**?: `string`

#### Source

[chain-api/src/types/token.ts:232](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L232)

***

### decimals

> **decimals**?: `number`

#### Source

[chain-api/src/types/token.ts:160](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L160)

***

### description

> **description**: `string`

#### Source

[chain-api/src/types/token.ts:195](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L195)

***

### image

> **image**: `string`

#### Source

[chain-api/src/types/token.ts:246](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L246)

***

### isNonFungible

> **isNonFungible**?: `boolean`

#### Source

[chain-api/src/types/token.ts:253](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L253)

***

### maxCapacity

> **maxCapacity**?: `BigNumber`

#### Source

[chain-api/src/types/token.ts:168](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L168)

***

### maxSupply

> **maxSupply**?: `BigNumber`

#### Source

[chain-api/src/types/token.ts:176](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L176)

***

### metadataAddress

> **metadataAddress**?: `string`

#### Source

[chain-api/src/types/token.ts:236](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L236)

***

### name

> **name**: `string`

#### Source

[chain-api/src/types/token.ts:187](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L187)

***

### network

> **network**?: `string`

#### Source

[chain-api/src/types/token.ts:152](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L152)

***

### rarity

> **rarity**?: `string`

#### Source

[chain-api/src/types/token.ts:243](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L243)

***

### signature

> **signature**?: `string`

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`signature`](ChainCallDTO.md#signature)

#### Source

[chain-api/src/types/dtos.ts:134](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L134)

***

### signerPublicKey

> **signerPublicKey**?: `string`

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`signerPublicKey`](ChainCallDTO.md#signerpublickey)

#### Source

[chain-api/src/types/dtos.ts:143](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L143)

***

### symbol

> **symbol**: `string`

#### Source

[chain-api/src/types/token.ts:191](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L191)

***

### tokenClass

> **tokenClass**: [`TokenClassKey`](TokenClassKey.md)

#### Source

[chain-api/src/types/token.ts:184](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L184)

***

### totalBurned

> **totalBurned**?: `BigNumber`

#### Source

[chain-api/src/types/token.ts:228](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L228)

***

### totalMintAllowance

> **totalMintAllowance**?: `BigNumber`

#### Source

[chain-api/src/types/token.ts:206](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L206)

***

### totalSupply

> **totalSupply**?: `BigNumber`

#### Source

[chain-api/src/types/token.ts:217](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L217)

***

### trace

> **trace**?: [`TraceContext`](../interfaces/TraceContext.md)

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`trace`](ChainCallDTO.md#trace)

#### Source

[chain-api/src/types/dtos.ts:99](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L99)

***

### uniqueKey

> **uniqueKey**?: `string`

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`uniqueKey`](ChainCallDTO.md#uniquekey)

#### Source

[chain-api/src/types/dtos.ts:114](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L114)

***

### DEFAULT\_DECIMALS

> **`static`** **DEFAULT\_DECIMALS**: `number` = `0`

#### Source

[chain-api/src/types/token.ts:137](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L137)

***

### DEFAULT\_MAX\_CAPACITY

> **`static`** **DEFAULT\_MAX\_CAPACITY**: `BigNumber`

#### Source

[chain-api/src/types/token.ts:138](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L138)

***

### DEFAULT\_MAX\_SUPPLY

> **`static`** **DEFAULT\_MAX\_SUPPLY**: `BigNumber`

#### Source

[chain-api/src/types/token.ts:139](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L139)

***

### DEFAULT\_NETWORK

> **`static`** **DEFAULT\_NETWORK**: `string` = `"GC"`

#### Source

[chain-api/src/types/token.ts:136](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L136)

***

### ENCODING

> **`static`** **`readonly`** **ENCODING**: `"base64"` = `"base64"`

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`ENCODING`](ChainCallDTO.md#encoding)

#### Source

[chain-api/src/types/dtos.ts:100](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L100)

***

### INITIAL\_MINT\_ALLOWANCE

> **`static`** **INITIAL\_MINT\_ALLOWANCE**: `BigNumber`

#### Source

[chain-api/src/types/token.ts:140](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L140)

***

### INITIAL\_TOTAL\_BURNED

> **`static`** **INITIAL\_TOTAL\_BURNED**: `BigNumber`

#### Source

[chain-api/src/types/token.ts:142](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L142)

***

### INITIAL\_TOTAL\_SUPPLY

> **`static`** **INITIAL\_TOTAL\_SUPPLY**: `BigNumber`

#### Source

[chain-api/src/types/token.ts:141](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L141)

## Methods

### isSignatureValid()

> **isSignatureValid**(`publicKey`): `boolean`

#### Parameters

▪ **publicKey**: `string`

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`isSignatureValid`](ChainCallDTO.md#issignaturevalid)

#### Source

[chain-api/src/types/dtos.ts:185](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L185)

***

### serialize()

> **serialize**(): `string`

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`serialize`](ChainCallDTO.md#serialize)

#### Source

[chain-api/src/types/dtos.ts:157](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L157)

***

### sign()

> **sign**(`privateKey`, `useDer`): `void`

#### Parameters

▪ **privateKey**: `string`

▪ **useDer**: `boolean`= `false`

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`sign`](ChainCallDTO.md#sign)

#### Source

[chain-api/src/types/dtos.ts:168](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L168)

***

### signed()

> **signed**(`privateKey`, `useDer`): [`CreateTokenClassDto`](CreateTokenClassDto.md)

Creates a signed copy of current object.

#### Parameters

▪ **privateKey**: `string`

▪ **useDer**: `boolean`= `false`

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`signed`](ChainCallDTO.md#signed)

#### Source

[chain-api/src/types/dtos.ts:179](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L179)

***

### validate()

> **validate**(): `Promise`\<`ValidationError`[]\>

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`validate`](ChainCallDTO.md#validate)

#### Source

[chain-api/src/types/dtos.ts:145](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L145)

***

### validateOrReject()

> **validateOrReject**(): `Promise`\<`void`\>

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`validateOrReject`](ChainCallDTO.md#validateorreject)

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

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`deserialize`](ChainCallDTO.md#deserialize)

#### Source

[chain-api/src/types/dtos.ts:161](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L161)
