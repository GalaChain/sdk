**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > ICCP

# Interface: ICCP

## Contents

- [Properties](ICCP.md#properties)
  - [certificateAuthorities](ICCP.md#certificateauthorities)
  - [client](ICCP.md#client)
  - [name](ICCP.md#name)
  - [organizations](ICCP.md#organizations)
  - [peers](ICCP.md#peers)
  - [version](ICCP.md#version)

## Properties

### certificateAuthorities

> **certificateAuthorities**: `object`

#### Index signature

 \[`hostname`: `string`\]: `object`

#### Source

[chain-api/src/types/ccp.ts:48](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ccp.ts#L48)

***

### client

> **client**: `object`

#### Type declaration

##### connection

> **connection**: `object`

##### connection.timeout

> **connection.timeout**: `object`

##### connection.timeout.peer

> **connection.timeout.peer**: `object`

##### connection.timeout.peer.endorser

> **connection.timeout.peer.endorser**: `string`

##### organization

> **organization**: `string`

#### Source

[chain-api/src/types/ccp.ts:19](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ccp.ts#L19)

***

### name

> **name**: `string`

#### Source

[chain-api/src/types/ccp.ts:17](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ccp.ts#L17)

***

### organizations

> **organizations**: `object`

#### Index signature

 \[`orgName`: `string`\]: `object`

#### Source

[chain-api/src/types/ccp.ts:29](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ccp.ts#L29)

***

### peers

> **peers**: `object`

#### Index signature

 \[`hostname`: `string`\]: `object`

#### Source

[chain-api/src/types/ccp.ts:36](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ccp.ts#L36)

***

### version

> **version**: `string`

#### Source

[chain-api/src/types/ccp.ts:18](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ccp.ts#L18)
