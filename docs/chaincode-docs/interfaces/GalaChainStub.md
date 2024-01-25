**@gala-chain/chaincode** ∙ [API](../exports.md)

***

[API](../exports.md) > GalaChainStub

# Interface: GalaChainStub

## Contents

- [Extends](GalaChainStub.md#extends)
- [Methods](GalaChainStub.md#methods)
  - [createCompositeKey()](GalaChainStub.md#createcompositekey)
  - [deletePrivateData()](GalaChainStub.md#deleteprivatedata)
  - [deleteState()](GalaChainStub.md#deletestate)
  - [flushWrites()](GalaChainStub.md#flushwrites)
  - [getArgs()](GalaChainStub.md#getargs)
  - [getBinding()](GalaChainStub.md#getbinding)
  - [getCachedState()](GalaChainStub.md#getcachedstate)
  - [getCachedStateByPartialCompositeKey()](GalaChainStub.md#getcachedstatebypartialcompositekey)
  - [getChannelID()](GalaChainStub.md#getchannelid)
  - [getCreator()](GalaChainStub.md#getcreator)
  - [getDateTimestamp()](GalaChainStub.md#getdatetimestamp)
  - [getFunctionAndParameters()](GalaChainStub.md#getfunctionandparameters)
  - [getHistoryForKey()](GalaChainStub.md#gethistoryforkey)
  - [getMspID()](GalaChainStub.md#getmspid)
  - [getPrivateData()](GalaChainStub.md#getprivatedata)
  - [getPrivateDataByPartialCompositeKey()](GalaChainStub.md#getprivatedatabypartialcompositekey)
  - [getPrivateDataByRange()](GalaChainStub.md#getprivatedatabyrange)
  - [getPrivateDataHash()](GalaChainStub.md#getprivatedatahash)
  - [getPrivateDataQueryResult()](GalaChainStub.md#getprivatedataqueryresult)
  - [getPrivateDataValidationParameter()](GalaChainStub.md#getprivatedatavalidationparameter)
  - [getQueryResult()](GalaChainStub.md#getqueryresult)
  - [getQueryResultWithPagination()](GalaChainStub.md#getqueryresultwithpagination)
  - [getSignedProposal()](GalaChainStub.md#getsignedproposal)
  - [getState()](GalaChainStub.md#getstate)
  - [getStateByPartialCompositeKey()](GalaChainStub.md#getstatebypartialcompositekey)
  - [getStateByPartialCompositeKeyWithPagination()](GalaChainStub.md#getstatebypartialcompositekeywithpagination)
  - [getStateByRange()](GalaChainStub.md#getstatebyrange)
  - [getStateByRangeWithPagination()](GalaChainStub.md#getstatebyrangewithpagination)
  - [getStateValidationParameter()](GalaChainStub.md#getstatevalidationparameter)
  - [getStringArgs()](GalaChainStub.md#getstringargs)
  - [getTransient()](GalaChainStub.md#gettransient)
  - [getTxID()](GalaChainStub.md#gettxid)
  - [getTxTimestamp()](GalaChainStub.md#gettxtimestamp)
  - [invokeChaincode()](GalaChainStub.md#invokechaincode)
  - [putPrivateData()](GalaChainStub.md#putprivatedata)
  - [putState()](GalaChainStub.md#putstate)
  - [setEvent()](GalaChainStub.md#setevent)
  - [setPrivateDataValidationParameter()](GalaChainStub.md#setprivatedatavalidationparameter)
  - [setStateValidationParameter()](GalaChainStub.md#setstatevalidationparameter)
  - [splitCompositeKey()](GalaChainStub.md#splitcompositekey)

## Extends

- `ChaincodeStub`

## Methods

### createCompositeKey()

> **createCompositeKey**(`objectType`, `attributes`): `string`

#### Parameters

▪ **objectType**: `string`

▪ **attributes**: `string`[]

#### Inherited from

ChaincodeStub.createCompositeKey

#### Source

node\_modules/fabric-shim/types/index.d.ts:122

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

### deleteState()

> **deleteState**(`key`): `Promise`\<`void`\>

#### Parameters

▪ **key**: `string`

#### Inherited from

ChaincodeStub.deleteState

#### Source

node\_modules/fabric-shim/types/index.d.ts:107

***

### flushWrites()

> **flushWrites**(): `Promise`\<`void`\>

#### Source

[chaincode/src/types/GalaChainStub.ts:143](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/types/GalaChainStub.ts#L143)

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

### getCachedState()

> **getCachedState**(`key`): `Promise`\<`Uint8Array`\>

#### Parameters

▪ **key**: `string`

#### Source

[chaincode/src/types/GalaChainStub.ts:139](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/types/GalaChainStub.ts#L139)

***

### getCachedStateByPartialCompositeKey()

> **getCachedStateByPartialCompositeKey**(`objectType`, `attributes`): [`FabricIterable`](../type-aliases/FabricIterable.md)\<[`CachedKV`](CachedKV.md)\>

#### Parameters

▪ **objectType**: `string`

▪ **attributes**: `string`[]

#### Source

[chaincode/src/types/GalaChainStub.ts:141](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/types/GalaChainStub.ts#L141)

***

### getChannelID()

> **getChannelID**(): `string`

#### Inherited from

ChaincodeStub.getChannelID

#### Source

node\_modules/fabric-shim/types/index.d.ts:95

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

### getState()

> **getState**(`key`): `Promise`\<`Uint8Array`\>

#### Parameters

▪ **key**: `string`

#### Inherited from

ChaincodeStub.getState

#### Source

node\_modules/fabric-shim/types/index.d.ts:105

***

### getStateByPartialCompositeKey()

> **getStateByPartialCompositeKey**(`objectType`, `attributes`): `Promise`\<`StateQueryIterator`\> & `AsyncIterable`\<`KV`\>

#### Parameters

▪ **objectType**: `string`

▪ **attributes**: `string`[]

#### Inherited from

ChaincodeStub.getStateByPartialCompositeKey

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

ChaincodeStub.getStateByPartialCompositeKeyWithPagination

#### Source

node\_modules/fabric-shim/types/index.d.ts:113

***

### getStateByRange()

> **getStateByRange**(`startKey`, `endKey`): `Promise`\<`StateQueryIterator`\> & `AsyncIterable`\<`KV`\>

#### Parameters

▪ **startKey**: `string`

▪ **endKey**: `string`

#### Inherited from

ChaincodeStub.getStateByRange

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

### putState()

> **putState**(`key`, `value`): `Promise`\<`void`\>

#### Parameters

▪ **key**: `string`

▪ **value**: `Uint8Array`

#### Inherited from

ChaincodeStub.putState

#### Source

node\_modules/fabric-shim/types/index.d.ts:106

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
