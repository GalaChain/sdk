**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > signatures

# Variable: signatures

> **signatures**: `object`

## Type declaration

### calculateKeccak256

> **calculateKeccak256**: (`data`) => `Buffer`

#### Parameters

▪ **data**: `Buffer`

### enforceValidPublicKey

> **enforceValidPublicKey**: (`signature`, `payload`, `publicKey`) => `string`

#### Parameters

▪ **signature**: `undefined` \| `string`

▪ **payload**: `object`

▪ **publicKey**: `undefined` \| `string`

### getCompactBase64PublicKey

> **getCompactBase64PublicKey**: (`publicKey`) => `string`

#### Parameters

▪ **publicKey**: `string`

### getDERSignature

> **getDERSignature**: (`obj`, `privateKey`) => `string`

#### Parameters

▪ **obj**: `object`

▪ **privateKey**: `Buffer`

### getEthAddress

> **getEthAddress**: (`publicKey`) => `string`

#### Parameters

▪ **publicKey**: `string`

### getNonCompactHexPublicKey

> **getNonCompactHexPublicKey**: (`publicKey`) => `string`

#### Parameters

▪ **publicKey**: `string`

### getPayloadToSign

> **getPayloadToSign**: (`obj`) => `string`

#### Parameters

▪ **obj**: `object`

### getPublicKey

> **getPublicKey**: (`privateKey`) => `string`

#### Parameters

▪ **privateKey**: `string`

### getSignature

> **getSignature**: (`obj`, `privateKey`) => `string`

#### Parameters

▪ **obj**: `object`

▪ **privateKey**: `Buffer`

### isValid

> **isValid**: (`signature`, `obj`, `publicKey`) => `boolean`

#### Parameters

▪ **signature**: `string`

▪ **obj**: `object`

▪ **publicKey**: `string`

### isValidSecp256k1Signature

> **isValidSecp256k1Signature**: (`signature`, `dataHash`, `publicKey`) => `boolean`

#### Parameters

▪ **signature**: `Secp256k1Signature`

▪ **dataHash**: `Buffer`

▪ **publicKey**: `Buffer`

### normalizePrivateKey

> **normalizePrivateKey**: (`input`) => `Buffer`

#### Parameters

▪ **input**: `string`

### normalizePublicKey

> **normalizePublicKey**: (`input`) => `Buffer`

#### Parameters

▪ **input**: `string`

### normalizeSecp256k1Signature

> **normalizeSecp256k1Signature**: (`s`) => `Secp256k1Signature`

#### Parameters

▪ **s**: `string`

### recoverPublicKey

> **recoverPublicKey**: (`signature`, `obj`) => `string`

#### Parameters

▪ **signature**: `string`

▪ **obj**: `object`

### validatePublicKey

> **validatePublicKey**: (`publicKey`) => `void`

#### Parameters

▪ **publicKey**: `Buffer`

### validateSecp256k1PublicKey

> **validateSecp256k1PublicKey**: (`publicKey`) => `ec.KeyPair`

#### Parameters

▪ **publicKey**: `Buffer`

## Source

[chain-api/src/utils/signatures.ts:350](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/signatures.ts#L350)
