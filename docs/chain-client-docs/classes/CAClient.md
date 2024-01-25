**@gala-chain/client** ∙ [API](../exports.md)

***

[API](../exports.md) > CAClient

# Class: CAClient

## Contents

- [Constructors](CAClient.md#constructors)
  - [new CAClient(orgMsp, adminId, adminSecret, connectionProfile)](CAClient.md#new-caclientorgmsp-adminid-adminsecret-connectionprofile)
- [Properties](CAClient.md#properties)
  - [adminId](CAClient.md#adminid)
  - [affiliation](CAClient.md#affiliation)
  - [asLocalhost](CAClient.md#aslocalhost)
  - [caClient](CAClient.md#caclient)
  - [caHostName](CAClient.md#cahostname)
  - [enrolledAdmin](CAClient.md#enrolledadmin)
  - [orgMsp](CAClient.md#orgmsp)
  - [wallet](CAClient.md#wallet)
- [Methods](CAClient.md#methods)
  - [getIdentityOrRegisterUser()](CAClient.md#getidentityorregisteruser)
  - [isReady()](CAClient.md#isready)

## Constructors

### new CAClient(orgMsp, adminId, adminSecret, connectionProfile)

> **new CAClient**(`orgMsp`, `adminId`, `adminSecret`, `connectionProfile`): [`CAClient`](CAClient.md)

#### Parameters

▪ **orgMsp**: `string`

▪ **adminId**: `string`

▪ **adminSecret**: `string`

▪ **connectionProfile**: `Record`\<`string`, `unknown`\>

#### Source

[hf/CAClient.ts:29](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/hf/CAClient.ts#L29)

## Properties

### adminId

> **`readonly`** **adminId**: `string`

#### Source

[hf/CAClient.ts:26](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/hf/CAClient.ts#L26)

***

### affiliation

> **`readonly`** **affiliation**: `string`

#### Source

[hf/CAClient.ts:23](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/hf/CAClient.ts#L23)

***

### asLocalhost

> **`readonly`** **asLocalhost**: `boolean`

#### Source

[hf/CAClient.ts:22](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/hf/CAClient.ts#L22)

***

### caClient

> **`private`** **`readonly`** **caClient**: `FabricCAServices`

#### Source

[hf/CAClient.ts:27](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/hf/CAClient.ts#L27)

***

### caHostName

> **`readonly`** **caHostName**: `string`

#### Source

[hf/CAClient.ts:21](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/hf/CAClient.ts#L21)

***

### enrolledAdmin

> **`readonly`** **enrolledAdmin**: `Promise`\<`Identity`\>

#### Source

[hf/CAClient.ts:25](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/hf/CAClient.ts#L25)

***

### orgMsp

> **`readonly`** **orgMsp**: `string`

#### Source

[hf/CAClient.ts:20](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/hf/CAClient.ts#L20)

***

### wallet

> **`readonly`** **wallet**: `Promise`\<`Wallet`\>

#### Source

[hf/CAClient.ts:24](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/hf/CAClient.ts#L24)

## Methods

### getIdentityOrRegisterUser()

> **getIdentityOrRegisterUser**(`userId`): `Promise`\<`Identity`\>

#### Parameters

▪ **userId**: `string`

#### Source

[hf/CAClient.ts:55](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/hf/CAClient.ts#L55)

***

### isReady()

> **isReady**(): `Promise`\<`boolean`\>

#### Source

[hf/CAClient.ts:50](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/hf/CAClient.ts#L50)
