**@gala-chain/chaincode** ∙ [API](../exports.md)

***

[API](../exports.md) > GalaTransactionOptions

# Interface: GalaTransactionOptions`<T>`

## Contents

- [Type parameters](GalaTransactionOptions.md#type-parameters)
- [Properties](GalaTransactionOptions.md#properties)
  - [after](GalaTransactionOptions.md#after)
  - [allowedOrgs](GalaTransactionOptions.md#allowedorgs)
  - [apiMethodName](GalaTransactionOptions.md#apimethodname)
  - [before](GalaTransactionOptions.md#before)
  - [description](GalaTransactionOptions.md#description)
  - [enforceUniqueKey](GalaTransactionOptions.md#enforceuniquekey)
  - [in](GalaTransactionOptions.md#in)
  - [out](GalaTransactionOptions.md#out)
  - [sequence](GalaTransactionOptions.md#sequence)
  - [type](GalaTransactionOptions.md#type)
  - [verifySignature](GalaTransactionOptions.md#verifysignature)

## Type parameters

▪ **T** extends `ChainCallDTO`

## Properties

### after

> **after**?: [`GalaTransactionAfterFn`](../type-aliases/GalaTransactionAfterFn.md)

#### Source

[chaincode/src/contracts/GalaTransaction.ts:82](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/contracts/GalaTransaction.ts#L82)

***

### allowedOrgs

> **allowedOrgs**?: `string`[]

#### Source

[chaincode/src/contracts/GalaTransaction.ts:76](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/contracts/GalaTransaction.ts#L76)

***

### apiMethodName

> **apiMethodName**?: `string`

#### Source

[chaincode/src/contracts/GalaTransaction.ts:78](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/contracts/GalaTransaction.ts#L78)

***

### before

> **before**?: [`GalaTransactionBeforeFn`](../type-aliases/GalaTransactionBeforeFn.md)

#### Source

[chaincode/src/contracts/GalaTransaction.ts:81](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/contracts/GalaTransaction.ts#L81)

***

### description

> **description**?: `string`

#### Source

[chaincode/src/contracts/GalaTransaction.ts:73](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/contracts/GalaTransaction.ts#L73)

***

### enforceUniqueKey

> **enforceUniqueKey**?: `true`

#### Source

[chaincode/src/contracts/GalaTransaction.ts:80](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/contracts/GalaTransaction.ts#L80)

***

### in

> **in**?: `ClassConstructor`\<`Inferred`\<`T`, `any`\>\>

#### Source

[chaincode/src/contracts/GalaTransaction.ts:74](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/contracts/GalaTransaction.ts#L74)

***

### out

> **out**?: `OutType` \| `OutArrType`

#### Source

[chaincode/src/contracts/GalaTransaction.ts:75](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/contracts/GalaTransaction.ts#L75)

***

### sequence

> **sequence**?: `MethodAPI`[]

#### Source

[chaincode/src/contracts/GalaTransaction.ts:79](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/contracts/GalaTransaction.ts#L79)

***

### type

> **type**: `GalaTransactionType`

#### Source

[chaincode/src/contracts/GalaTransaction.ts:72](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/contracts/GalaTransaction.ts#L72)

***

### verifySignature

> **verifySignature**?: `true`

#### Source

[chaincode/src/contracts/GalaTransaction.ts:77](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/contracts/GalaTransaction.ts#L77)
