**@gala-chain/chaincode** ∙ [API](../exports.md)

***

[API](../exports.md) > GalaChainContext

# Class: GalaChainContext

## Contents

- [Extends](GalaChainContext.md#extends)
- [Constructors](GalaChainContext.md#constructors)
  - [new GalaChainContext()](GalaChainContext.md#new-galachaincontext)
- [Properties](GalaChainContext.md#properties)
  - [callingUserEthAddressValue](GalaChainContext.md#callinguserethaddressvalue)
  - [callingUserValue](GalaChainContext.md#callinguservalue)
  - [clientIdentity](GalaChainContext.md#clientidentity)
  - [loggerInstance](GalaChainContext.md#loggerinstance)
  - [logging](GalaChainContext.md#logging)
  - [span](GalaChainContext.md#span)
  - [stub](GalaChainContext.md#stub)
  - [txUnixTimeValue](GalaChainContext.md#txunixtimevalue)
- [Accessors](GalaChainContext.md#accessors)
  - [callingUser](GalaChainContext.md#callinguser)
  - [callingUserData](GalaChainContext.md#callinguserdata)
  - [callingUserEthAddress](GalaChainContext.md#callinguserethaddress)
  - [logger](GalaChainContext.md#logger)
  - [txUnixTime](GalaChainContext.md#txunixtime)
- [Methods](GalaChainContext.md#methods)
  - [setChaincodeStub()](GalaChainContext.md#setchaincodestub)

## Extends

- `Context`

## Constructors

### new GalaChainContext()

> **new GalaChainContext**(): [`GalaChainContext`](GalaChainContext.md)

#### Inherited from

Context.constructor

## Properties

### callingUserEthAddressValue

> **`private`** **callingUserEthAddressValue**?: `string`

#### Source

[chaincode/src/types/GalaChainContext.ts:90](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/types/GalaChainContext.ts#L90)

***

### callingUserValue

> **`private`** **callingUserValue**?: `string`

#### Source

[chaincode/src/types/GalaChainContext.ts:89](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/types/GalaChainContext.ts#L89)

***

### clientIdentity

> **clientIdentity**: `ClientIdentity`

#### Inherited from

Context.clientIdentity

#### Source

node\_modules/fabric-contract-api/types/index.d.ts:14

***

### loggerInstance

> **`private`** **loggerInstance**?: `GalaLoggerInstance`

#### Source

[chaincode/src/types/GalaChainContext.ts:92](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/types/GalaChainContext.ts#L92)

***

### logging

> **logging**: `object`

#### Type declaration

##### getLogger

> **getLogger**: (`name`?) => `Logger`

###### Parameters

▪ **name?**: `string`

##### setLevel

> **setLevel**: (`level`) => `void`

###### Parameters

▪ **level**: `string`

#### Inherited from

Context.logging

#### Source

node\_modules/fabric-contract-api/types/index.d.ts:15

***

### span

> **span**?: `SpanContext`

#### Source

[chaincode/src/types/GalaChainContext.ts:88](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/types/GalaChainContext.ts#L88)

***

### stub

> **stub**: [`GalaChainStub`](../interfaces/GalaChainStub.md)

#### Overrides

Context.stub

#### Source

[chaincode/src/types/GalaChainContext.ts:87](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/types/GalaChainContext.ts#L87)

***

### txUnixTimeValue

> **`private`** **txUnixTimeValue**?: `number`

#### Source

[chaincode/src/types/GalaChainContext.ts:91](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/types/GalaChainContext.ts#L91)

## Accessors

### callingUser

> **`get`** **callingUser**(): `string`

#### Source

[chaincode/src/types/GalaChainContext.ts:101](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/types/GalaChainContext.ts#L101)

***

### callingUserData

> **`set`** **callingUserData**(`d`): `void`

#### Parameters

▪ **d**: `object`

▪ **d.alias**: `string`

▪ **d.ethAddress**: `undefined` \| `string`

#### Source

[chaincode/src/types/GalaChainContext.ts:115](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/types/GalaChainContext.ts#L115)

***

### callingUserEthAddress

> **`get`** **callingUserEthAddress**(): `string`

#### Source

[chaincode/src/types/GalaChainContext.ts:108](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/types/GalaChainContext.ts#L108)

***

### logger

> **`get`** **logger**(): `GalaLoggerInstance`

#### Source

[chaincode/src/types/GalaChainContext.ts:94](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/types/GalaChainContext.ts#L94)

***

### txUnixTime

> **`get`** **txUnixTime**(): `number`

#### Source

[chaincode/src/types/GalaChainContext.ts:123](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/types/GalaChainContext.ts#L123)

## Methods

### setChaincodeStub()

> **setChaincodeStub**(`stub`): `void`

#### Parameters

▪ **stub**: `ChaincodeStub`

#### Source

[chaincode/src/types/GalaChainContext.ts:130](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/types/GalaChainContext.ts#L130)
