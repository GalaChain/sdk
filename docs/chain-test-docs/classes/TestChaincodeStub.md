**@gala-chain/test** ∙ [API](../exports.md)

***

[API](../exports.md) > TestChaincodeStub

# Class: TestChaincodeStub

## Contents

- [Extends](TestChaincodeStub.md#extends)
- [Constructors](TestChaincodeStub.md#constructors)
  - [new TestChaincodeStub(args, state, writes)](TestChaincodeStub.md#new-testchaincodestubargs-state-writes)
  - [new TestChaincodeStub(client, channel_id, txId, chaincodeInput, signedProposal)](TestChaincodeStub.md#new-testchaincodestubclient-channel-id-txid-chaincodeinput-signedproposal)
- [Properties](TestChaincodeStub.md#properties)
  - [creator](TestChaincodeStub.md#creator)
  - [deleteState](TestChaincodeStub.md#deletestate)
  - [getState](TestChaincodeStub.md#getstate)
  - [getStateByPartialCompositeKey](TestChaincodeStub.md#getstatebypartialcompositekey)
  - [putState](TestChaincodeStub.md#putstate)
  - [state](TestChaincodeStub.md#state)
  - [writes](TestChaincodeStub.md#writes)
  - [creator](TestChaincodeStub.md#creator-1)
  - [epoch](TestChaincodeStub.md#epoch)
- [Methods](TestChaincodeStub.md#methods)
  - [createCompositeKey()](TestChaincodeStub.md#createcompositekey)
  - [deletePrivateData()](TestChaincodeStub.md#deleteprivatedata)
  - [getArgs()](TestChaincodeStub.md#getargs)
  - [getBinding()](TestChaincodeStub.md#getbinding)
  - [getChannelID()](TestChaincodeStub.md#getchannelid)
  - [getClientIdentity()](TestChaincodeStub.md#getclientidentity)
  - [getCreator()](TestChaincodeStub.md#getcreator)
  - [getDateTimestamp()](TestChaincodeStub.md#getdatetimestamp)
  - [getFunctionAndParameters()](TestChaincodeStub.md#getfunctionandparameters)
  - [getHistoryForKey()](TestChaincodeStub.md#gethistoryforkey)
  - [getMspID()](TestChaincodeStub.md#getmspid)
  - [getPrivateData()](TestChaincodeStub.md#getprivatedata)
  - [getPrivateDataByPartialCompositeKey()](TestChaincodeStub.md#getprivatedatabypartialcompositekey)
  - [getPrivateDataByRange()](TestChaincodeStub.md#getprivatedatabyrange)
  - [getPrivateDataHash()](TestChaincodeStub.md#getprivatedatahash)
  - [getPrivateDataQueryResult()](TestChaincodeStub.md#getprivatedataqueryresult)
  - [getPrivateDataValidationParameter()](TestChaincodeStub.md#getprivatedatavalidationparameter)
  - [getQueryResult()](TestChaincodeStub.md#getqueryresult)
  - [getQueryResultWithPagination()](TestChaincodeStub.md#getqueryresultwithpagination)
  - [getSignedProposal()](TestChaincodeStub.md#getsignedproposal)
  - [getStateByPartialCompositeKeyWithPagination()](TestChaincodeStub.md#getstatebypartialcompositekeywithpagination)
  - [getStateByRange()](TestChaincodeStub.md#getstatebyrange)
  - [getStateByRangeWithPagination()](TestChaincodeStub.md#getstatebyrangewithpagination)
  - [getStateValidationParameter()](TestChaincodeStub.md#getstatevalidationparameter)
  - [getStringArgs()](TestChaincodeStub.md#getstringargs)
  - [getTransient()](TestChaincodeStub.md#gettransient)
  - [getTxID()](TestChaincodeStub.md#gettxid)
  - [getTxTimestamp()](TestChaincodeStub.md#gettxtimestamp)
  - [invokeChaincode()](TestChaincodeStub.md#invokechaincode)
  - [mockState()](TestChaincodeStub.md#mockstate)
  - [putPrivateData()](TestChaincodeStub.md#putprivatedata)
  - [setEvent()](TestChaincodeStub.md#setevent)
  - [setPrivateDataValidationParameter()](TestChaincodeStub.md#setprivatedatavalidationparameter)
  - [setStateValidationParameter()](TestChaincodeStub.md#setstatevalidationparameter)
  - [splitCompositeKey()](TestChaincodeStub.md#splitcompositekey)
  - [createCompositeKey()](TestChaincodeStub.md#createcompositekey-1)
  - [deletePrivateData()](TestChaincodeStub.md#deleteprivatedata-1)
  - [deleteState()](TestChaincodeStub.md#deletestate)
  - [getArgs()](TestChaincodeStub.md#getargs-1)
  - [getBinding()](TestChaincodeStub.md#getbinding-1)
  - [getChannelID()](TestChaincodeStub.md#getchannelid-1)
  - [getCreator()](TestChaincodeStub.md#getcreator-1)
  - [getDateTimestamp()](TestChaincodeStub.md#getdatetimestamp-1)
  - [getFunctionAndParameters()](TestChaincodeStub.md#getfunctionandparameters-1)
  - [getHistoryForKey()](TestChaincodeStub.md#gethistoryforkey-1)
  - [getMspID()](TestChaincodeStub.md#getmspid-1)
  - [getPrivateData()](TestChaincodeStub.md#getprivatedata-1)
  - [getPrivateDataByPartialCompositeKey()](TestChaincodeStub.md#getprivatedatabypartialcompositekey-1)
  - [getPrivateDataByRange()](TestChaincodeStub.md#getprivatedatabyrange-1)
  - [getPrivateDataHash()](TestChaincodeStub.md#getprivatedatahash-1)
  - [getPrivateDataQueryResult()](TestChaincodeStub.md#getprivatedataqueryresult-1)
  - [getPrivateDataValidationParameter()](TestChaincodeStub.md#getprivatedatavalidationparameter-1)
  - [getQueryResult()](TestChaincodeStub.md#getqueryresult-1)
  - [getQueryResultWithPagination()](TestChaincodeStub.md#getqueryresultwithpagination-1)
  - [getSignedProposal()](TestChaincodeStub.md#getsignedproposal-1)
  - [getState()](TestChaincodeStub.md#getstate)
  - [getStateByPartialCompositeKey()](TestChaincodeStub.md#getstatebypartialcompositekey)
  - [getStateByPartialCompositeKeyWithPagination()](TestChaincodeStub.md#getstatebypartialcompositekeywithpagination-1)
  - [getStateByRange()](TestChaincodeStub.md#getstatebyrange-1)
  - [getStateByRangeWithPagination()](TestChaincodeStub.md#getstatebyrangewithpagination-1)
  - [getStateValidationParameter()](TestChaincodeStub.md#getstatevalidationparameter-1)
  - [getStringArgs()](TestChaincodeStub.md#getstringargs-1)
  - [getTransient()](TestChaincodeStub.md#gettransient-1)
  - [getTxID()](TestChaincodeStub.md#gettxid-1)
  - [getTxTimestamp()](TestChaincodeStub.md#gettxtimestamp-1)
  - [invokeChaincode()](TestChaincodeStub.md#invokechaincode-1)
  - [putPrivateData()](TestChaincodeStub.md#putprivatedata-1)
  - [putState()](TestChaincodeStub.md#putstate)
  - [setEvent()](TestChaincodeStub.md#setevent-1)
  - [setPrivateDataValidationParameter()](TestChaincodeStub.md#setprivatedatavalidationparameter-1)
  - [setStateValidationParameter()](TestChaincodeStub.md#setstatevalidationparameter-1)
  - [splitCompositeKey()](TestChaincodeStub.md#splitcompositekey-1)

## Extends

- `ChaincodeStub`

## Constructors

### new TestChaincodeStub(args, state, writes)

> **new TestChaincodeStub**(`args`, `state`, `writes`): [`TestChaincodeStub`](TestChaincodeStub.md)

#### Parameters

▪ **args**: `string`[]

▪ **state**: `undefined` \| `Record`\<`string`, `string`\>

▪ **writes**: `undefined` \| `Record`\<`string`, `string`\>

#### Overrides

ChaincodeStub.constructor

#### Source

[chain-test/src/unit/TestChaincodeStub.ts:78](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-test/src/unit/TestChaincodeStub.ts#L78)

***

### new TestChaincodeStub(client, channel_id, txId, chaincodeInput, signedProposal)

> **new TestChaincodeStub**(`client`, `channel_id`, `txId`, `chaincodeInput`, `signedProposal`): [`ChaincodeStubClassType`](../interfaces/ChaincodeStubClassType.md)

#### Parameters

▪ **client**: `any`

▪ **channel\_id**: `any`

▪ **txId**: `any`

▪ **chaincodeInput**: `any`

▪ **signedProposal**: `any`

#### Overrides

ChaincodeStub.constructor

#### Source

[chain-test/src/unit/TestChaincodeStub.ts:23](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-test/src/unit/TestChaincodeStub.ts#L23)

## Properties

### creator

> **creator**: `unknown`

#### Inherited from

ChaincodeStub.creator

#### Source

[chain-test/src/unit/TestChaincodeStub.ts:25](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-test/src/unit/TestChaincodeStub.ts#L25)

***

### deleteState

> **deleteState**: (`key`) => `Promise`\<`void`\>

#### Parameters

▪ **key**: `string`

#### Overrides

ChaincodeStub.deleteState

#### Source

[chain-test/src/unit/TestChaincodeStub.ts:126](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-test/src/unit/TestChaincodeStub.ts#L126)

***

### getState

> **getState**: (`key`) => `Promise`\<`Uint8Array`\>

#### Parameters

▪ **key**: `string`

#### Overrides

ChaincodeStub.getState

#### Source

[chain-test/src/unit/TestChaincodeStub.ts:133](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-test/src/unit/TestChaincodeStub.ts#L133)

***

### getStateByPartialCompositeKey

> **getStateByPartialCompositeKey**: (`objectType`, `attributes`) => `FabricIterable`\<`KV`\>

#### Parameters

▪ **objectType**: `string`

▪ **attributes**: `string`[]

#### Overrides

ChaincodeStub.getStateByPartialCompositeKey

#### Source

[chain-test/src/unit/TestChaincodeStub.ts:139](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-test/src/unit/TestChaincodeStub.ts#L139)

***

### putState

> **putState**: (`key`, `value`) => `Promise`\<`void`\>

#### Parameters

▪ **key**: `string`

▪ **value**: `Uint8Array`

#### Overrides

ChaincodeStub.putState

#### Source

[chain-test/src/unit/TestChaincodeStub.ts:118](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-test/src/unit/TestChaincodeStub.ts#L118)

***

### state

> **`readonly`** **state**: `Record`\<`string`, `string`\>

#### Source

[chain-test/src/unit/TestChaincodeStub.ts:75](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-test/src/unit/TestChaincodeStub.ts#L75)

***

### writes

> **`readonly`** **writes**: `Record`\<`string`, `string`\>

#### Source

[chain-test/src/unit/TestChaincodeStub.ts:76](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-test/src/unit/TestChaincodeStub.ts#L76)

***

### creator

> **`static`** **creator**: `unknown`

#### Inherited from

ChaincodeStub.creator

#### Source

[chain-test/src/unit/TestChaincodeStub.ts:25](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-test/src/unit/TestChaincodeStub.ts#L25)

***

### epoch

> **`static`** **`private`** **epoch**: `number` = `0`

#### Source

[chain-test/src/unit/TestChaincodeStub.ts:74](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-test/src/unit/TestChaincodeStub.ts#L74)

## Methods

### createCompositeKey()

> **createCompositeKey**(`objectType`, `attributes`): `string`

#### Parameters

▪ **objectType**: `string`

▪ **attributes**: `string`[]

#### Inherited from

ChaincodeStub.createCompositeKey

#### Source

[chain-test/src/unit/TestChaincodeStub.ts:27](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-test/src/unit/TestChaincodeStub.ts#L27)

***

### deletePrivateData()

> **deletePrivateData**(`collection`, `key`): `Promise`\<`void`\>

#### Parameters

▪ **collection**: `string`

▪ **key**: `string`

#### Inherited from

ChaincodeStub.deletePrivateData

#### Source

node\_modules/fabric-shim/types/index.d.ts:128

***

### getArgs()

> **getArgs**(): `string`[]

#### Inherited from

ChaincodeStub.getArgs

#### Source

node\_modules/fabric-shim/types/index.d.ts:90

***

### getBinding()

> **getBinding**(): `string`

#### Inherited from

ChaincodeStub.getBinding

#### Source

node\_modules/fabric-shim/types/index.d.ts:103

***

### getChannelID()

> **getChannelID**(): `string`

#### Inherited from

ChaincodeStub.getChannelID

#### Source

node\_modules/fabric-shim/types/index.d.ts:95

***

### getClientIdentity()

> **getClientIdentity**(`caUser`, `mspId`): `ClientIdentity`

#### Parameters

▪ **caUser**: `string`

▪ **mspId**: `string`

#### Source

[chain-test/src/unit/TestChaincodeStub.ts:110](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-test/src/unit/TestChaincodeStub.ts#L110)

***

### getCreator()

> **getCreator**(): `SerializedIdentity`

#### Inherited from

ChaincodeStub.getCreator

#### Source

node\_modules/fabric-shim/types/index.d.ts:96

***

### getDateTimestamp()

> **getDateTimestamp**(): `Date`

#### Inherited from

ChaincodeStub.getDateTimestamp

#### Source

node\_modules/fabric-shim/types/index.d.ts:102

***

### getFunctionAndParameters()

> **getFunctionAndParameters**(): `object`

#### Returns

> ##### fcn
>
> > **fcn**: `string`
>
> ##### params
>
> > **params**: `string`[]
>

#### Inherited from

ChaincodeStub.getFunctionAndParameters

#### Source

node\_modules/fabric-shim/types/index.d.ts:92

***

### getHistoryForKey()

> **getHistoryForKey**(`key`): `Promise`\<`HistoryQueryIterator`\> & `AsyncIterable`\<`KeyModification`\>

#### Parameters

▪ **key**: `string`

#### Inherited from

ChaincodeStub.getHistoryForKey

#### Source

node\_modules/fabric-shim/types/index.d.ts:117

***

### getMspID()

> **getMspID**(): `string`

#### Inherited from

ChaincodeStub.getMspID

#### Source

node\_modules/fabric-shim/types/index.d.ts:97

***

### getPrivateData()

> **getPrivateData**(`collection`, `key`): `Promise`\<`Uint8Array`\>

#### Parameters

▪ **collection**: `string`

▪ **key**: `string`

#### Inherited from

ChaincodeStub.getPrivateData

#### Source

node\_modules/fabric-shim/types/index.d.ts:125

***

### getPrivateDataByPartialCompositeKey()

> **getPrivateDataByPartialCompositeKey**(`collection`, `objectType`, `attributes`): `Promise`\<`StateQueryIterator`\> & `AsyncIterable`\<`KV`\>

#### Parameters

▪ **collection**: `string`

▪ **objectType**: `string`

▪ **attributes**: `string`[]

#### Inherited from

ChaincodeStub.getPrivateDataByPartialCompositeKey

#### Source

node\_modules/fabric-shim/types/index.d.ts:132

***

### getPrivateDataByRange()

> **getPrivateDataByRange**(`collection`, `startKey`, `endKey`): `Promise`\<`StateQueryIterator`\> & `AsyncIterable`\<`KV`\>

#### Parameters

▪ **collection**: `string`

▪ **startKey**: `string`

▪ **endKey**: `string`

#### Inherited from

ChaincodeStub.getPrivateDataByRange

#### Source

node\_modules/fabric-shim/types/index.d.ts:131

***

### getPrivateDataHash()

> **getPrivateDataHash**(`collection`, `key`): `Promise`\<`Uint8Array`\>

#### Parameters

▪ **collection**: `string`

▪ **key**: `string`

#### Inherited from

ChaincodeStub.getPrivateDataHash

#### Source

node\_modules/fabric-shim/types/index.d.ts:126

***

### getPrivateDataQueryResult()

> **getPrivateDataQueryResult**(`collection`, `query`): `Promise`\<`StateQueryIterator`\> & `AsyncIterable`\<`KV`\>

#### Parameters

▪ **collection**: `string`

▪ **query**: `string`

#### Inherited from

ChaincodeStub.getPrivateDataQueryResult

#### Source

node\_modules/fabric-shim/types/index.d.ts:133

***

### getPrivateDataValidationParameter()

> **getPrivateDataValidationParameter**(`collection`, `key`): `Promise`\<`Uint8Array`\>

#### Parameters

▪ **collection**: `string`

▪ **key**: `string`

#### Inherited from

ChaincodeStub.getPrivateDataValidationParameter

#### Source

node\_modules/fabric-shim/types/index.d.ts:130

***

### getQueryResult()

> **getQueryResult**(`query`): `Promise`\<`StateQueryIterator`\> & `AsyncIterable`\<`KV`\>

#### Parameters

▪ **query**: `string`

#### Inherited from

ChaincodeStub.getQueryResult

#### Source

node\_modules/fabric-shim/types/index.d.ts:115

***

### getQueryResultWithPagination()

> **getQueryResultWithPagination**(`query`, `pageSize`, `bookmark`?): `Promise`\<`StateQueryResponse`\<`StateQueryIterator`\>\> & `AsyncIterable`\<`KV`\>

#### Parameters

▪ **query**: `string`

▪ **pageSize**: `number`

▪ **bookmark?**: `string`

#### Inherited from

ChaincodeStub.getQueryResultWithPagination

#### Source

node\_modules/fabric-shim/types/index.d.ts:116

***

### getSignedProposal()

> **getSignedProposal**(): `SignedProposal`

#### Inherited from

ChaincodeStub.getSignedProposal

#### Source

node\_modules/fabric-shim/types/index.d.ts:100

***

### getStateByPartialCompositeKeyWithPagination()

> **getStateByPartialCompositeKeyWithPagination**(`indexKey`, `keyParts`, `pageSize`, `bookmark`?): `Promise`\<`StateQueryResponse`\<`StateQueryIterator`\>\> & `AsyncIterable`\<`KV`\>

#### Parameters

▪ **indexKey**: `string`

▪ **keyParts**: `string`[]

▪ **pageSize**: `number`

▪ **bookmark?**: `string`

#### Overrides

ChaincodeStub.getStateByPartialCompositeKeyWithPagination

#### Source

[chain-test/src/unit/TestChaincodeStub.ts:150](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-test/src/unit/TestChaincodeStub.ts#L150)

***

### getStateByRange()

> **getStateByRange**(`start`, `end`): `Promise`\<`StateQueryIterator`\> & `AsyncIterable`\<`KV`\>

#### Parameters

▪ **start**: `string`

▪ **end**: `string`

#### Overrides

ChaincodeStub.getStateByRange

#### Source

[chain-test/src/unit/TestChaincodeStub.ts:181](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-test/src/unit/TestChaincodeStub.ts#L181)

***

### getStateByRangeWithPagination()

> **getStateByRangeWithPagination**(`startKey`, `endKey`, `pageSize`, `bookmark`?): `Promise`\<`StateQueryResponse`\<`StateQueryIterator`\>\> & `AsyncIterable`\<`KV`\>

#### Parameters

▪ **startKey**: `string`

▪ **endKey**: `string`

▪ **pageSize**: `number`

▪ **bookmark?**: `string`

#### Inherited from

ChaincodeStub.getStateByRangeWithPagination

#### Source

node\_modules/fabric-shim/types/index.d.ts:111

***

### getStateValidationParameter()

> **getStateValidationParameter**(`key`): `Promise`\<`Uint8Array`\>

#### Parameters

▪ **key**: `string`

#### Inherited from

ChaincodeStub.getStateValidationParameter

#### Source

node\_modules/fabric-shim/types/index.d.ts:109

***

### getStringArgs()

> **getStringArgs**(): `string`[]

#### Inherited from

ChaincodeStub.getStringArgs

#### Source

node\_modules/fabric-shim/types/index.d.ts:91

***

### getTransient()

> **getTransient**(): `Map`\<`string`, `Uint8Array`\>

#### Inherited from

ChaincodeStub.getTransient

#### Source

node\_modules/fabric-shim/types/index.d.ts:98

***

### getTxID()

> **getTxID**(): `string`

#### Inherited from

ChaincodeStub.getTxID

#### Source

node\_modules/fabric-shim/types/index.d.ts:94

***

### getTxTimestamp()

> **getTxTimestamp**(): `Timestamp`

#### Inherited from

ChaincodeStub.getTxTimestamp

#### Source

node\_modules/fabric-shim/types/index.d.ts:101

***

### invokeChaincode()

> **invokeChaincode**(`chaincodeName`, `args`, `channel`): `Promise`\<`ChaincodeResponse`\>

#### Parameters

▪ **chaincodeName**: `string`

▪ **args**: `string`[]

▪ **channel**: `string`

#### Inherited from

ChaincodeStub.invokeChaincode

#### Source

node\_modules/fabric-shim/types/index.d.ts:119

***

### mockState()

> **mockState**(`key`, `value`): `void`

#### Parameters

▪ **key**: `string`

▪ **value**: `string`

#### Source

[chain-test/src/unit/TestChaincodeStub.ts:114](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-test/src/unit/TestChaincodeStub.ts#L114)

***

### putPrivateData()

> **putPrivateData**(`collection`, `key`, `value`): `Promise`\<`void`\>

#### Parameters

▪ **collection**: `string`

▪ **key**: `string`

▪ **value**: `Uint8Array`

#### Inherited from

ChaincodeStub.putPrivateData

#### Source

node\_modules/fabric-shim/types/index.d.ts:127

***

### setEvent()

> **setEvent**(`name`, `payload`): `void`

#### Parameters

▪ **name**: `string`

▪ **payload**: `Uint8Array`

#### Inherited from

ChaincodeStub.setEvent

#### Source

node\_modules/fabric-shim/types/index.d.ts:120

***

### setPrivateDataValidationParameter()

> **setPrivateDataValidationParameter**(`collection`, `key`, `ep`): `Promise`\<`void`\>

#### Parameters

▪ **collection**: `string`

▪ **key**: `string`

▪ **ep**: `Uint8Array`

#### Inherited from

ChaincodeStub.setPrivateDataValidationParameter

#### Source

node\_modules/fabric-shim/types/index.d.ts:129

***

### setStateValidationParameter()

> **setStateValidationParameter**(`key`, `ep`): `Promise`\<`void`\>

#### Parameters

▪ **key**: `string`

▪ **ep**: `Uint8Array`

#### Inherited from

ChaincodeStub.setStateValidationParameter

#### Source

node\_modules/fabric-shim/types/index.d.ts:108

***

### splitCompositeKey()

> **splitCompositeKey**(`compositeKey`): `SplitCompositekey`

#### Parameters

▪ **compositeKey**: `string`

#### Inherited from

ChaincodeStub.splitCompositeKey

#### Source

node\_modules/fabric-shim/types/index.d.ts:123

***

### createCompositeKey()

> **`static`** **createCompositeKey**(`objectType`, `attributes`): `string`

#### Parameters

▪ **objectType**: `string`

▪ **attributes**: `string`[]

#### Inherited from

ChaincodeStub.createCompositeKey

#### Source

[chain-test/src/unit/TestChaincodeStub.ts:27](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-test/src/unit/TestChaincodeStub.ts#L27)

***

### deletePrivateData()

> **`static`** **deletePrivateData**(`collection`, `key`): `Promise`\<`void`\>

#### Parameters

▪ **collection**: `string`

▪ **key**: `string`

#### Inherited from

ChaincodeStub.deletePrivateData

#### Source

node\_modules/fabric-shim/types/index.d.ts:128

***

### deleteState()

> **`static`** **deleteState**(`key`): `Promise`\<`void`\>

#### Parameters

▪ **key**: `string`

#### Inherited from

ChaincodeStub.deleteState

#### Source

node\_modules/fabric-shim/types/index.d.ts:107

***

### getArgs()

> **`static`** **getArgs**(): `string`[]

#### Inherited from

ChaincodeStub.getArgs

#### Source

node\_modules/fabric-shim/types/index.d.ts:90

***

### getBinding()

> **`static`** **getBinding**(): `string`

#### Inherited from

ChaincodeStub.getBinding

#### Source

node\_modules/fabric-shim/types/index.d.ts:103

***

### getChannelID()

> **`static`** **getChannelID**(): `string`

#### Inherited from

ChaincodeStub.getChannelID

#### Source

node\_modules/fabric-shim/types/index.d.ts:95

***

### getCreator()

> **`static`** **getCreator**(): `SerializedIdentity`

#### Inherited from

ChaincodeStub.getCreator

#### Source

node\_modules/fabric-shim/types/index.d.ts:96

***

### getDateTimestamp()

> **`static`** **getDateTimestamp**(): `Date`

#### Inherited from

ChaincodeStub.getDateTimestamp

#### Source

node\_modules/fabric-shim/types/index.d.ts:102

***

### getFunctionAndParameters()

> **`static`** **getFunctionAndParameters**(): `object`

#### Returns

> ##### fcn
>
> > **fcn**: `string`
>
> ##### params
>
> > **params**: `string`[]
>

#### Inherited from

ChaincodeStub.getFunctionAndParameters

#### Source

node\_modules/fabric-shim/types/index.d.ts:92

***

### getHistoryForKey()

> **`static`** **getHistoryForKey**(`key`): `Promise`\<`HistoryQueryIterator`\> & `AsyncIterable`\<`KeyModification`\>

#### Parameters

▪ **key**: `string`

#### Inherited from

ChaincodeStub.getHistoryForKey

#### Source

node\_modules/fabric-shim/types/index.d.ts:117

***

### getMspID()

> **`static`** **getMspID**(): `string`

#### Inherited from

ChaincodeStub.getMspID

#### Source

node\_modules/fabric-shim/types/index.d.ts:97

***

### getPrivateData()

> **`static`** **getPrivateData**(`collection`, `key`): `Promise`\<`Uint8Array`\>

#### Parameters

▪ **collection**: `string`

▪ **key**: `string`

#### Inherited from

ChaincodeStub.getPrivateData

#### Source

node\_modules/fabric-shim/types/index.d.ts:125

***

### getPrivateDataByPartialCompositeKey()

> **`static`** **getPrivateDataByPartialCompositeKey**(`collection`, `objectType`, `attributes`): `Promise`\<`StateQueryIterator`\> & `AsyncIterable`\<`KV`\>

#### Parameters

▪ **collection**: `string`

▪ **objectType**: `string`

▪ **attributes**: `string`[]

#### Inherited from

ChaincodeStub.getPrivateDataByPartialCompositeKey

#### Source

node\_modules/fabric-shim/types/index.d.ts:132

***

### getPrivateDataByRange()

> **`static`** **getPrivateDataByRange**(`collection`, `startKey`, `endKey`): `Promise`\<`StateQueryIterator`\> & `AsyncIterable`\<`KV`\>

#### Parameters

▪ **collection**: `string`

▪ **startKey**: `string`

▪ **endKey**: `string`

#### Inherited from

ChaincodeStub.getPrivateDataByRange

#### Source

node\_modules/fabric-shim/types/index.d.ts:131

***

### getPrivateDataHash()

> **`static`** **getPrivateDataHash**(`collection`, `key`): `Promise`\<`Uint8Array`\>

#### Parameters

▪ **collection**: `string`

▪ **key**: `string`

#### Inherited from

ChaincodeStub.getPrivateDataHash

#### Source

node\_modules/fabric-shim/types/index.d.ts:126

***

### getPrivateDataQueryResult()

> **`static`** **getPrivateDataQueryResult**(`collection`, `query`): `Promise`\<`StateQueryIterator`\> & `AsyncIterable`\<`KV`\>

#### Parameters

▪ **collection**: `string`

▪ **query**: `string`

#### Inherited from

ChaincodeStub.getPrivateDataQueryResult

#### Source

node\_modules/fabric-shim/types/index.d.ts:133

***

### getPrivateDataValidationParameter()

> **`static`** **getPrivateDataValidationParameter**(`collection`, `key`): `Promise`\<`Uint8Array`\>

#### Parameters

▪ **collection**: `string`

▪ **key**: `string`

#### Inherited from

ChaincodeStub.getPrivateDataValidationParameter

#### Source

node\_modules/fabric-shim/types/index.d.ts:130

***

### getQueryResult()

> **`static`** **getQueryResult**(`query`): `Promise`\<`StateQueryIterator`\> & `AsyncIterable`\<`KV`\>

#### Parameters

▪ **query**: `string`

#### Inherited from

ChaincodeStub.getQueryResult

#### Source

node\_modules/fabric-shim/types/index.d.ts:115

***

### getQueryResultWithPagination()

> **`static`** **getQueryResultWithPagination**(`query`, `pageSize`, `bookmark`?): `Promise`\<`StateQueryResponse`\<`StateQueryIterator`\>\> & `AsyncIterable`\<`KV`\>

#### Parameters

▪ **query**: `string`

▪ **pageSize**: `number`

▪ **bookmark?**: `string`

#### Inherited from

ChaincodeStub.getQueryResultWithPagination

#### Source

node\_modules/fabric-shim/types/index.d.ts:116

***

### getSignedProposal()

> **`static`** **getSignedProposal**(): `SignedProposal`

#### Inherited from

ChaincodeStub.getSignedProposal

#### Source

node\_modules/fabric-shim/types/index.d.ts:100

***

### getState()

> **`static`** **getState**(`key`): `Promise`\<`Uint8Array`\>

#### Parameters

▪ **key**: `string`

#### Inherited from

ChaincodeStub.getState

#### Source

node\_modules/fabric-shim/types/index.d.ts:105

***

### getStateByPartialCompositeKey()

> **`static`** **getStateByPartialCompositeKey**(`objectType`, `attributes`): `Promise`\<`StateQueryIterator`\> & `AsyncIterable`\<`KV`\>

#### Parameters

▪ **objectType**: `string`

▪ **attributes**: `string`[]

#### Inherited from

ChaincodeStub.getStateByPartialCompositeKey

#### Source

node\_modules/fabric-shim/types/index.d.ts:112

***

### getStateByPartialCompositeKeyWithPagination()

> **`static`** **getStateByPartialCompositeKeyWithPagination**(`objectType`, `attributes`, `pageSize`, `bookmark`?): `Promise`\<`StateQueryResponse`\<`StateQueryIterator`\>\> & `AsyncIterable`\<`KV`\>

#### Parameters

▪ **objectType**: `string`

▪ **attributes**: `string`[]

▪ **pageSize**: `number`

▪ **bookmark?**: `string`

#### Inherited from

ChaincodeStub.getStateByPartialCompositeKeyWithPagination

#### Source

node\_modules/fabric-shim/types/index.d.ts:113

***

### getStateByRange()

> **`static`** **getStateByRange**(`startKey`, `endKey`): `Promise`\<`StateQueryIterator`\> & `AsyncIterable`\<`KV`\>

#### Parameters

▪ **startKey**: `string`

▪ **endKey**: `string`

#### Inherited from

ChaincodeStub.getStateByRange

#### Source

node\_modules/fabric-shim/types/index.d.ts:110

***

### getStateByRangeWithPagination()

> **`static`** **getStateByRangeWithPagination**(`startKey`, `endKey`, `pageSize`, `bookmark`?): `Promise`\<`StateQueryResponse`\<`StateQueryIterator`\>\> & `AsyncIterable`\<`KV`\>

#### Parameters

▪ **startKey**: `string`

▪ **endKey**: `string`

▪ **pageSize**: `number`

▪ **bookmark?**: `string`

#### Inherited from

ChaincodeStub.getStateByRangeWithPagination

#### Source

node\_modules/fabric-shim/types/index.d.ts:111

***

### getStateValidationParameter()

> **`static`** **getStateValidationParameter**(`key`): `Promise`\<`Uint8Array`\>

#### Parameters

▪ **key**: `string`

#### Inherited from

ChaincodeStub.getStateValidationParameter

#### Source

node\_modules/fabric-shim/types/index.d.ts:109

***

### getStringArgs()

> **`static`** **getStringArgs**(): `string`[]

#### Inherited from

ChaincodeStub.getStringArgs

#### Source

node\_modules/fabric-shim/types/index.d.ts:91

***

### getTransient()

> **`static`** **getTransient**(): `Map`\<`string`, `Uint8Array`\>

#### Inherited from

ChaincodeStub.getTransient

#### Source

node\_modules/fabric-shim/types/index.d.ts:98

***

### getTxID()

> **`static`** **getTxID**(): `string`

#### Inherited from

ChaincodeStub.getTxID

#### Source

node\_modules/fabric-shim/types/index.d.ts:94

***

### getTxTimestamp()

> **`static`** **getTxTimestamp**(): `Timestamp`

#### Inherited from

ChaincodeStub.getTxTimestamp

#### Source

node\_modules/fabric-shim/types/index.d.ts:101

***

### invokeChaincode()

> **`static`** **invokeChaincode**(`chaincodeName`, `args`, `channel`): `Promise`\<`ChaincodeResponse`\>

#### Parameters

▪ **chaincodeName**: `string`

▪ **args**: `string`[]

▪ **channel**: `string`

#### Inherited from

ChaincodeStub.invokeChaincode

#### Source

node\_modules/fabric-shim/types/index.d.ts:119

***

### putPrivateData()

> **`static`** **putPrivateData**(`collection`, `key`, `value`): `Promise`\<`void`\>

#### Parameters

▪ **collection**: `string`

▪ **key**: `string`

▪ **value**: `Uint8Array`

#### Inherited from

ChaincodeStub.putPrivateData

#### Source

node\_modules/fabric-shim/types/index.d.ts:127

***

### putState()

> **`static`** **putState**(`key`, `value`): `Promise`\<`void`\>

#### Parameters

▪ **key**: `string`

▪ **value**: `Uint8Array`

#### Inherited from

ChaincodeStub.putState

#### Source

node\_modules/fabric-shim/types/index.d.ts:106

***

### setEvent()

> **`static`** **setEvent**(`name`, `payload`): `void`

#### Parameters

▪ **name**: `string`

▪ **payload**: `Uint8Array`

#### Inherited from

ChaincodeStub.setEvent

#### Source

node\_modules/fabric-shim/types/index.d.ts:120

***

### setPrivateDataValidationParameter()

> **`static`** **setPrivateDataValidationParameter**(`collection`, `key`, `ep`): `Promise`\<`void`\>

#### Parameters

▪ **collection**: `string`

▪ **key**: `string`

▪ **ep**: `Uint8Array`

#### Inherited from

ChaincodeStub.setPrivateDataValidationParameter

#### Source

node\_modules/fabric-shim/types/index.d.ts:129

***

### setStateValidationParameter()

> **`static`** **setStateValidationParameter**(`key`, `ep`): `Promise`\<`void`\>

#### Parameters

▪ **key**: `string`

▪ **ep**: `Uint8Array`

#### Inherited from

ChaincodeStub.setStateValidationParameter

#### Source

node\_modules/fabric-shim/types/index.d.ts:108

***

### splitCompositeKey()

> **`static`** **splitCompositeKey**(`compositeKey`): `SplitCompositekey`

#### Parameters

▪ **compositeKey**: `string`

#### Inherited from

ChaincodeStub.splitCompositeKey

#### Source

node\_modules/fabric-shim/types/index.d.ts:123
