**@gala-chain/chaincode** ∙ [API](../exports.md)

***

[API](../exports.md) > IIdentity

# Interface: IIdentity

## Contents

- [Extends](IIdentity.md#extends)
- [Properties](IIdentity.md#properties)
  - [credentials](IIdentity.md#credentials)
  - [mspId](IIdentity.md#mspid)
  - [type](IIdentity.md#type)
  - [version](IIdentity.md#version)

## Extends

- `Identity`

## Properties

### credentials

> **credentials**: `object`

#### Type declaration

##### certificate

> **certificate**: `string`

##### privateKey

> **privateKey**: `string`

#### Source

[chaincode/src/types/identity.ts:18](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/types/identity.ts#L18)

***

### mspId

> **mspId**: `string`

#### Inherited from

BaseIdentity.mspId

#### Source

node\_modules/fabric-network/lib/impl/wallet/identity.d.ts:3

***

### type

> **type**: `string`

#### Inherited from

BaseIdentity.type

#### Source

node\_modules/fabric-network/lib/impl/wallet/identity.d.ts:2

***

### version

> **version**: `number`

#### Source

[chaincode/src/types/identity.ts:22](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/types/identity.ts#L22)
