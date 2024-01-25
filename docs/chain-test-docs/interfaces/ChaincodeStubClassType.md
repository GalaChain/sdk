**@gala-chain/test** ∙ [API](../exports.md)

***

[API](../exports.md) > ChaincodeStubClassType

# Interface: ChaincodeStubClassType

## Contents

- [Extends](ChaincodeStubClassType.md#extends)
- [Constructors](ChaincodeStubClassType.md#constructors)
  - [new ChaincodeStubClassType(client, channel_id, txId, chaincodeInput, signedProposal)](ChaincodeStubClassType.md#new-chaincodestubclasstypeclient-channel-id-txid-chaincodeinput-signedproposal)
- [Properties](ChaincodeStubClassType.md#properties)
  - [creator](ChaincodeStubClassType.md#creator)
- [Methods](ChaincodeStubClassType.md#methods)
  - [createCompositeKey()](ChaincodeStubClassType.md#createcompositekey)
  - [deletePrivateData()](ChaincodeStubClassType.md#deleteprivatedata)
  - [deleteState()](ChaincodeStubClassType.md#deletestate)
  - [getArgs()](ChaincodeStubClassType.md#getargs)
  - [getBinding()](ChaincodeStubClassType.md#getbinding)
  - [getChannelID()](ChaincodeStubClassType.md#getchannelid)
  - [getCreator()](ChaincodeStubClassType.md#getcreator)
  - [getDateTimestamp()](ChaincodeStubClassType.md#getdatetimestamp)
  - [getFunctionAndParameters()](ChaincodeStubClassType.md#getfunctionandparameters)
  - [getHistoryForKey()](ChaincodeStubClassType.md#gethistoryforkey)
  - [getMspID()](ChaincodeStubClassType.md#getmspid)
  - [getPrivateData()](ChaincodeStubClassType.md#getprivatedata)
  - [getPrivateDataByPartialCompositeKey()](ChaincodeStubClassType.md#getprivatedatabypartialcompositekey)
  - [getPrivateDataByRange()](ChaincodeStubClassType.md#getprivatedatabyrange)
  - [getPrivateDataHash()](ChaincodeStubClassType.md#getprivatedatahash)
  - [getPrivateDataQueryResult()](ChaincodeStubClassType.md#getprivatedataqueryresult)
  - [getPrivateDataValidationParameter()](ChaincodeStubClassType.md#getprivatedatavalidationparameter)
  - [getQueryResult()](ChaincodeStubClassType.md#getqueryresult)
  - [getQueryResultWithPagination()](ChaincodeStubClassType.md#getqueryresultwithpagination)
  - [getSignedProposal()](ChaincodeStubClassType.md#getsignedproposal)
  - [getState()](ChaincodeStubClassType.md#getstate)
  - [getStateByPartialCompositeKey()](ChaincodeStubClassType.md#getstatebypartialcompositekey)
  - [getStateByPartialCompositeKeyWithPagination()](ChaincodeStubClassType.md#getstatebypartialcompositekeywithpagination)
  - [getStateByRange()](ChaincodeStubClassType.md#getstatebyrange)
  - [getStateByRangeWithPagination()](ChaincodeStubClassType.md#getstatebyrangewithpagination)
  - [getStateValidationParameter()](ChaincodeStubClassType.md#getstatevalidationparameter)
  - [getStringArgs()](ChaincodeStubClassType.md#getstringargs)
  - [getTransient()](ChaincodeStubClassType.md#gettransient)
  - [getTxID()](ChaincodeStubClassType.md#gettxid)
  - [getTxTimestamp()](ChaincodeStubClassType.md#gettxtimestamp)
  - [invokeChaincode()](ChaincodeStubClassType.md#invokechaincode)
  - [putPrivateData()](ChaincodeStubClassType.md#putprivatedata)
  - [putState()](ChaincodeStubClassType.md#putstate)
  - [setEvent()](ChaincodeStubClassType.md#setevent)
  - [setPrivateDataValidationParameter()](ChaincodeStubClassType.md#setprivatedatavalidationparameter)
  - [setStateValidationParameter()](ChaincodeStubClassType.md#setstatevalidationparameter)
  - [splitCompositeKey()](ChaincodeStubClassType.md#splitcompositekey)

## Extends

- `ChaincodeStub`

## Constructors

### new ChaincodeStubClassType(client, channel_id, txId, chaincodeInput, signedProposal)

> **new ChaincodeStubClassType**(`client`, `channel_id`, `txId`, `chaincodeInput`, `signedProposal`): [`ChaincodeStubClassType`](ChaincodeStubClassType.md)

#### Parameters

▪ **client**: `any`

▪ **channel\_id**: `any`

▪ **txId**: `any`

▪ **chaincodeInput**: `any`

▪ **signedProposal**: `any`

#### Inherited from

FChaincodeStub.constructor

#### Source

[chain-test/src/unit/TestChaincodeStub.ts:23](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-test/src/unit/TestChaincodeStub.ts#L23)

## Properties

### creator

> **creator**: `unknown`

#### Source

[chain-test/src/unit/TestChaincodeStub.ts:25](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-test/src/unit/TestChaincodeStub.ts#L25)

## Methods

### createCompositeKey()

> **createCompositeKey**(`objectType`, `attributes`): `string`

#### Parameters

▪ **objectType**: `string`

▪ **attributes**: `string`[]

#### Overrides

FChaincodeStub.createCompositeKey

#### Source

[chain-test/src/unit/TestChaincodeStub.ts:27](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-test/src/unit/TestChaincodeStub.ts#L27)

***

### deletePrivateData()

> **deletePrivateData**(`collection`, `key`): `Promise`\<`void`\>

#### Parameters

▪ **collection**: `string`

▪ **key**: `string`

#### Inherited from

FChaincodeStub.deletePrivateData

#### Source

node\_modules/fabric-shim/types/index.d.ts:128

***

### deleteState()

> **deleteState**(`key`): `Promise`\<`void`\>

#### Parameters

▪ **key**: `string`

#### Inherited from

FChaincodeStub.deleteState

#### Source

node\_modules/fabric-shim/types/index.d.ts:107

***

### getArgs()

> **getArgs**(): `string`[]

#### Inherited from

FChaincodeStub.getArgs

#### Source

node\_modules/fabric-shim/types/index.d.ts:90

***

### getBinding()

> **getBinding**(): `string`

#### Inherited from

FChaincodeStub.getBinding

#### Source

node\_modules/fabric-shim/types/index.d.ts:103

***

### getChannelID()

> **getChannelID**(): `string`

#### Inherited from

FChaincodeStub.getChannelID

#### Source

node\_modules/fabric-shim/types/index.d.ts:95

***

### getCreator()

> **getCreator**(): `SerializedIdentity`

#### Inherited from

FChaincodeStub.getCreator

#### Source

node\_modules/fabric-shim/types/index.d.ts:96

***

### getDateTimestamp()

> **getDateTimestamp**(): `Date`

#### Inherited from

FChaincodeStub.getDateTimestamp

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

FChaincodeStub.getFunctionAndParameters

#### Source

node\_modules/fabric-shim/types/index.d.ts:92

***

### getHistoryForKey()

> **getHistoryForKey**(`key`): `Promise`\<`HistoryQueryIterator`\> & `AsyncIterable`\<`KeyModification`\>

#### Parameters

▪ **key**: `string`

#### Inherited from

FChaincodeStub.getHistoryForKey

#### Source

node\_modules/fabric-shim/types/index.d.ts:117

***

### getMspID()

> **getMspID**(): `string`

#### Inherited from

FChaincodeStub.getMspID

#### Source

node\_modules/fabric-shim/types/index.d.ts:97

***

### getPrivateData()

> **getPrivateData**(`collection`, `key`): `Promise`\<`Uint8Array`\>

#### Parameters

▪ **collection**: `string`

▪ **key**: `string`

#### Inherited from

FChaincodeStub.getPrivateData

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

FChaincodeStub.getPrivateDataByPartialCompositeKey

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

FChaincodeStub.getPrivateDataByRange

#### Source

node\_modules/fabric-shim/types/index.d.ts:131

***

### getPrivateDataHash()

> **getPrivateDataHash**(`collection`, `key`): `Promise`\<`Uint8Array`\>

#### Parameters

▪ **collection**: `string`

▪ **key**: `string`

#### Inherited from

FChaincodeStub.getPrivateDataHash

#### Source

node\_modules/fabric-shim/types/index.d.ts:126

***

### getPrivateDataQueryResult()

> **getPrivateDataQueryResult**(`collection`, `query`): `Promise`\<`StateQueryIterator`\> & `AsyncIterable`\<`KV`\>

#### Parameters

▪ **collection**: `string`

▪ **query**: `string`

#### Inherited from

FChaincodeStub.getPrivateDataQueryResult

#### Source

node\_modules/fabric-shim/types/index.d.ts:133

***

### getPrivateDataValidationParameter()

> **getPrivateDataValidationParameter**(`collection`, `key`): `Promise`\<`Uint8Array`\>

#### Parameters

▪ **collection**: `string`

▪ **key**: `string`

#### Inherited from

FChaincodeStub.getPrivateDataValidationParameter

#### Source

node\_modules/fabric-shim/types/index.d.ts:130

***

### getQueryResult()

> **getQueryResult**(`query`): `Promise`\<`StateQueryIterator`\> & `AsyncIterable`\<`KV`\>

#### Parameters

▪ **query**: `string`

#### Inherited from

FChaincodeStub.getQueryResult

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

FChaincodeStub.getQueryResultWithPagination

#### Source

node\_modules/fabric-shim/types/index.d.ts:116

***

### getSignedProposal()

> **getSignedProposal**(): `SignedProposal`

#### Inherited from

FChaincodeStub.getSignedProposal

#### Source

node\_modules/fabric-shim/types/index.d.ts:100

***

### getState()

> **getState**(`key`): `Promise`\<`Uint8Array`\>

#### Parameters

▪ **key**: `string`

#### Inherited from

FChaincodeStub.getState

#### Source

node\_modules/fabric-shim/types/index.d.ts:105

***

### getStateByPartialCompositeKey()

> **getStateByPartialCompositeKey**(`objectType`, `attributes`): `Promise`\<`StateQueryIterator`\> & `AsyncIterable`\<`KV`\>

#### Parameters

▪ **objectType**: `string`

▪ **attributes**: `string`[]

#### Inherited from

FChaincodeStub.getStateByPartialCompositeKey

#### Source

node\_modules/fabric-shim/types/index.d.ts:112

***

### getStateByPartialCompositeKeyWithPagination()

> **getStateByPartialCompositeKeyWithPagination**(`objectType`, `attributes`, `pageSize`, `bookmark`?): `Promise`\<`StateQueryResponse`\<`StateQueryIterator`\>\> & `AsyncIterable`\<`KV`\>

#### Parameters

▪ **objectType**: `string`

▪ **attributes**: `string`[]

▪ **pageSize**: `number`

▪ **bookmark?**: `string`

#### Inherited from

FChaincodeStub.getStateByPartialCompositeKeyWithPagination

#### Source

node\_modules/fabric-shim/types/index.d.ts:113

***

### getStateByRange()

> **getStateByRange**(`startKey`, `endKey`): `Promise`\<`StateQueryIterator`\> & `AsyncIterable`\<`KV`\>

#### Parameters

▪ **startKey**: `string`

▪ **endKey**: `string`

#### Inherited from

FChaincodeStub.getStateByRange

#### Source

node\_modules/fabric-shim/types/index.d.ts:110

***

### getStateByRangeWithPagination()

> **getStateByRangeWithPagination**(`startKey`, `endKey`, `pageSize`, `bookmark`?): `Promise`\<`StateQueryResponse`\<`StateQueryIterator`\>\> & `AsyncIterable`\<`KV`\>

#### Parameters

▪ **startKey**: `string`

▪ **endKey**: `string`

▪ **pageSize**: `number`

▪ **bookmark?**: `string`

#### Inherited from

FChaincodeStub.getStateByRangeWithPagination

#### Source

node\_modules/fabric-shim/types/index.d.ts:111

***

### getStateValidationParameter()

> **getStateValidationParameter**(`key`): `Promise`\<`Uint8Array`\>

#### Parameters

▪ **key**: `string`

#### Inherited from

FChaincodeStub.getStateValidationParameter

#### Source

node\_modules/fabric-shim/types/index.d.ts:109

***

### getStringArgs()

> **getStringArgs**(): `string`[]

#### Inherited from

FChaincodeStub.getStringArgs

#### Source

node\_modules/fabric-shim/types/index.d.ts:91

***

### getTransient()

> **getTransient**(): `Map`\<`string`, `Uint8Array`\>

#### Inherited from

FChaincodeStub.getTransient

#### Source

node\_modules/fabric-shim/types/index.d.ts:98

***

### getTxID()

> **getTxID**(): `string`

#### Inherited from

FChaincodeStub.getTxID

#### Source

node\_modules/fabric-shim/types/index.d.ts:94

***

### getTxTimestamp()

> **getTxTimestamp**(): `Timestamp`

#### Inherited from

FChaincodeStub.getTxTimestamp

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

FChaincodeStub.invokeChaincode

#### Source

node\_modules/fabric-shim/types/index.d.ts:119

***

### putPrivateData()

> **putPrivateData**(`collection`, `key`, `value`): `Promise`\<`void`\>

#### Parameters

▪ **collection**: `string`

▪ **key**: `string`

▪ **value**: `Uint8Array`

#### Inherited from

FChaincodeStub.putPrivateData

#### Source

node\_modules/fabric-shim/types/index.d.ts:127

***

### putState()

> **putState**(`key`, `value`): `Promise`\<`void`\>

#### Parameters

▪ **key**: `string`

▪ **value**: `Uint8Array`

#### Inherited from

FChaincodeStub.putState

#### Source

node\_modules/fabric-shim/types/index.d.ts:106

***

### setEvent()

> **setEvent**(`name`, `payload`): `void`

#### Parameters

▪ **name**: `string`

▪ **payload**: `Uint8Array`

#### Inherited from

FChaincodeStub.setEvent

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

FChaincodeStub.setPrivateDataValidationParameter

#### Source

node\_modules/fabric-shim/types/index.d.ts:129

***

### setStateValidationParameter()

> **setStateValidationParameter**(`key`, `ep`): `Promise`\<`void`\>

#### Parameters

▪ **key**: `string`

▪ **ep**: `Uint8Array`

#### Inherited from

FChaincodeStub.setStateValidationParameter

#### Source

node\_modules/fabric-shim/types/index.d.ts:108

***

### splitCompositeKey()

> **splitCompositeKey**(`compositeKey`): `SplitCompositekey`

#### Parameters

▪ **compositeKey**: `string`

#### Inherited from

FChaincodeStub.splitCompositeKey

#### Source

node\_modules/fabric-shim/types/index.d.ts:123
