# High-Throughput Minting

GalaChain's solution to prevent over-minting the supply or circulating capacity of 
a token while avoiding multi-version concurrency conflicts. 

This document is primarily focused on the application-layer coding of 
logic executed during a single transaction. The perspective is that of 
an application layer developer writing chaincode. 

## Prerequisites

This article is an advanced topic, and assumes the reader has some familiarity with [Hyperledger Fabric](https://hyperledger-fabric.readthedocs.io/en/release-2.5/blockchain.html), Gala's chaincode implementations ([@gala-chain/api](https://github.com/GalaChain/sdk/tree/2800918fdb6c51a149d7f1f0e22b6bc9ca167bbb/chain-api),  [@gala-chain/chaincode](https://github.com/GalaChain/sdk/tree/2800918fdb6c51a149d7f1f0e22b6bc9ca167bbb/chaincode)), concurrency in distributed systems, and [multi-version conccurrency control](https://en.wikipedia.org/wiki/Multiversion_concurrency_control), [Ledger facts and entries](https://hyperledger-fabric.readthedocs.io/en/release-2.5/ledger/ledger.html#ledgers-facts-and-states), [world state](https://hyperledger-fabric.readthedocs.io/en/release-2.5/ledger/ledger.html#world-state), [Block data](https://hyperledger-fabric.readthedocs.io/en/release-2.5/ledger/ledger.html#blocks), [transactions](https://hyperledger-fabric.readthedocs.io/en/release-2.5/ledger/ledger.html#transactions), and ordering. 

There is currently (Nov 2024 at the time of this writing) an [open issue](https://github.com/hyperledger/fabric/issues/3748) in the Hyperledger Fabric repository requesting documentation on the meaning of [MVCC_READ_CONFLICT](https://github.com/hyperledger/fabric-protos-go/blob/6bee4929a99f57fb45951417baab5ee80b1ad8ad/peer/transaction.pb.go#L38). 

For the purposes of this document, it is also worthwhile to understand Fabric's [PHANTOM_READ_CONFLICT](https://github.com/hyperledger/fabric-protos-go/blob/6bee4929a99f57fb45951417baab5ee80b1ad8ad/peer/transaction.pb.go#L39) error code. 

In brief, an `MVCC_READ_CONFLICT` is a multi-version concurrency conflict generally caused by more than one transaction reading different versions of the same World State key/value within the same block. This occurs when the value represented by the key is written in a different transaction. When peers go to validate these transactions, conflicts occur. 

A `PHANTOM_READ_CONFLICT` occurs when a range read contains a different result set between different transaction, usually because one transaction added a new entry that falls within the range read executed by another transaction. 

## Original Problem 

The [original implementation of our TokenClass](https://github.com/GalaChain/sdk/blob/2800918fdb6c51a149d7f1f0e22b6bc9ca167bbb/chain-api/src/types/TokenClass.ts#L180-L186) in our assets chaincode used a single 
`totalSupply` property as a counter to increment during mint operations. 

This was much more straightforward to code to, and was done consciously in the early stages (2022) of the project to move forward with the general implementation.

However, the original implementation suffers from a lack of scalability
due to the shared use and writing of singular properties on the
`TokenClass` chain object, especially `totalSupply`.

Reading and/or writing this shared object in more than one
transaction per block causes `MVCC_READ_CONFLICT`s and failed
transactions.

An important clarification up front: The semantics of the GalaChain SDK use `totalSupply` to mean 
the total amount of a token ever minted, and `totalCapacity` to mean the current _circulating_ 
capacity (total ever minted minus total burned). This semantic has been in place since the beginning (2022).

Some systems or other chains may use "supply" and "capacity" in different, or even opposite ways. 

It's unfortunate that the word "circulating" or "circulation" is not 
used in these property names, but changing them this many years after original creation would require 
some signfiicant data migration. 

In this document, understand the term "supply" to represent the total amount of the token 
ever minted, not the current quantity in circulation. 

## Existing High-Throughput Options and Decided Approach

Options for implementing high throughput writes to a shared value
are documented and varied. 

This implementation combines the
Running Total approach with the Submit/Verify approach.

The Running Total approach is well detailed in Jakub Dzikowski's
blog post series detailing concurrent smart contracts in
Hyperledger Fabric:
[(part 3)](https://blog.softwaremill.com/concurrent-smart-contracts-in-hyperledger-fabric-blockchain-part-3-ee3b8351a107) 
(published 2019, retrieved 2022-2024). This post describes a method for 
maintaining a running total that represents a user's balance, using two separate 
contracts to intitiate and complete transfers, encoding a 
status code to differentiate `STARTED` from `COMPLETED`/`REJECTED` transfers, 
tradeoffs inherent to using the transaction timestamp value to order transactions, 
and important considerations for key design in a LevelDB implementation (including lexical ordering and 
representing numeric timestamps as strings). 

The official hyperledger/fabric-samples repository also contains a
sample high thrhoughput implementation written in Golang that includes a descriptive
[README detailing strategies](https://github.com/hyperledger/fabric-samples/tree/f16e9e6de5a8f7b9110e4f7697108abbcaf28e49/high-throughput
) published 2017, retrieved 2022-2024:
Submit/Verify is briefly described in Example 2, Solution 2 at
the time of this writing (Nov 2022). Basically, it describes one process that Submits a delta to an 
account balance (credit or debit), and a separate process that verifies that combined deltas over time 
don't overdraw an account. 

Consider both of the above to be required prerequisite reads for reviewing, using, and understanding 
the GalaChain High Throughput Mint implementation. 

This GalaChain document (and code) may use the Submit/Verify and Request/Fulfill semantics interchangeably. 

Additional references:

* [https://blog.softwaremill.com/concurrent-smart-contracts-in-hyperledger-fabric-blockchain-part-1-bba32b2c0e08](https://blog.softwaremill.com/concurrent-smart-contracts-in-hyperledger-fabric-blockchain-part-1-bba32b2c0e08)
* [https://blog.softwaremill.com/concurrent-smart-contracts-in-hyperledger-fabric-blockchain-part-2-fc09af32e48d](https://blog.softwaremill.com/concurrent-smart-contracts-in-hyperledger-fabric-blockchain-part-2-fc09af32e48d)
* [https://hyperledger-fabric.readthedocs.io/en/release-2.4/ledger/ledger.html](https://hyperledger-fabric.readthedocs.io/en/release-2.4/ledger/ledger.html)
* [https://hyperledger-fabric.readthedocs.io/en/release-2.4/ledger/ledger.html#blocks](https://hyperledger-fabric.readthedocs.io/en/release-2.4/ledger/ledger.html#blocks)
* [https://hyperledger-fabric.readthedocs.io/en/release-2.4/txflow.html](https://hyperledger-fabric.readthedocs.io/en/release-2.4/txflow.html)
* [https://hyperledger-fabric.readthedocs.io/en/release-2.4/readwrite.html](https://hyperledger-fabric.readthedocs.io/en/release-2.4/readwrite.html)
* [https://hyperledger-fabric.readthedocs.io/en/release-2.4/smartcontract/smartcontract.html](https://hyperledger-fabric.readthedocs.io/en/release-2.4/smartcontract/smartcontract.html)
* [https://github.com/hyperledger/fabric-chaincode-go/blob/main/shim/interfaces.go](https://github.com/hyperledger/fabric-chaincode-go/blob/main/shim/interfaces.go)

(above Retrieved Nov 2022)

## GalaChain High-Throughput: Running Total, Submit/Verify, and Ongoing near Realtime Verification/Reconciliation

The current implementation works with a lookback based mechanism
to track the runningTotal as we move forward in time. Timestamps are inverted against an 
extreme far-future date, stringified and ordered lexigraphically in ascending order from 
most recent to oldest (see **Inverting Time** below). 

A request/fulfill mechanism spreads the mint across two
separate blocks. 

Requests contain a delta on the total token mint supply. Fulfilling a request invovles 
iterating through the results of a range read of recent request entries and summing the deltas 
to ensure the maximum supply and capacity will not be exceeded. 

A sequence operation encoded into the GalaChain Operations API 
abstracts the two-part Submit/Verify process from the end user, making 
the two calls seem like a single call from the client perspective. 

During each part of the sequence a specific lookback time is used in a
getStateByRange query with a specific handling of lexigraphically-
ordered key generation. 

This permits us to write values from the current
block while only reading values from prior blocks, solving our `PHANTOM_READ` problem.

The brittleness of this approach is that it needs for this lookback time
to be at least equal to the current block timeout. In order to account 
for potential clock drift, ordering, and validation time it likely should 
be larger. 

If the blockTimeout variable ends up less than the current block
timeout, then `PHANTOM_READ`s can begin occurring again. 
If this occurs, our other mitigation strategies (e.g. retry-logic in our Operations API) can potentially help alleviate errors and hold some load. 

If we order our lexigraphic, time based keys in ascending order of time stamp (i.e. oldest first) then the most recent 
entries containing the most up-to-date supply values would be inserted at the end of the index space. Eventually the 
result set could grow and occupy more than one page of results. 

If we want to get some number of entries in the recent past, offset by the approximate 
current block time, and iterate through them until we have satisfied some criteria determing that 
we have accounted for all open requests, then the most efficient way to do so would be to go backwards in time: Newest to oldest.

Because LevelDB does not offer a way to reverse a results set, ordering keys oldest first 
would mean starting at the oldest potential entry and iterating through the entire result set to get to the newest result. 

What we need is a key design that lets us lexigraphically order a time based key in a way that we can query 
the result set in ascending order, newest to oldest. 

### Inverting Time

GalaChain is currently built on `fabric-sdk-node`, and its Gateway and Operation API are built on Node.js. The JavaScript programming language 
expresses Unix timestamps in milliseconds, not seconds. 

Pick a number of milliseconds far into the future, say the estimated time when the Earth itself will die. Call this the `inversionHeight`.

Subtract the current time in milliseconds from that value. Pad the front with zeroes to a standardized length and convert it to a string Simple Key. The closer we are to the time horizon, the more leading zeroes in our key.

We now have a most-recent first, ascending key that can be range queried against. Each new key of the current time will be inserted first, because it's the lowest value lexigraphically. 

A range query with a start key some time in the past will skip over any keys representing times happening later. In the 
Fulfillment steps described below, we can create a startKey offset into the recent past by a multiplier of the block timemout, and and 
endKey that bounds some larger multiplier of the blockTimeout. If new keys are written to the index space by other transactions during 
the current transaction's execution, their keys will be inserted before our startKey. Once we have loaded our time-bound range 
query from LevelDB, we can reverse them and iterate through oldest first to calculate the deltas and add up mints that may have 
happened concurrently with the Request we are currently trying to Fulfill. It's like rewinding an audio tape, and then playing it back. 

We avoid the `PHANTOM_READ` problem by carefully crafting range read queries that skip over the index key space 
which could potentially acquire new writes during the current block. 

## Time within the execution of a single Transaction

Clock drift can be a problem in distributed systems, and should always be considered. However, Hyperledger Fabric 
peer networks should agree on transaction timestamps, as they are validated, finalized, 
and ordered in blocks. We at least can count on the transaction timestamp being consistent 
across peers and during transaction validation. 

If we know the block timeout, then we can use it to bound our queries. If we can reasonably assume transaction 
timestamps to be bound within some approximation of this block timeout, then we can trust that 
writes won't occur inside our bounded query by other transactions during the current block processing. 

During application code execution, we can't know exactly where within a block's timeout our transaction's time stamp falls. If our block timeout is 2,000 milliseconds, we have to assume our transaction's time stamp is occurring anywhere within that 1-2,000 range. We can't pinpoint it exactly, and we can't guess at the horizon between our transaction's timestamp and the time the previous block was determined. 

A limitation or tradeoff we work with in this implementation is the assumption that no transactions written in the 
current block will have transaction timestamps less than n * 1 block timeout in the past. If this generally holds true, we 
won't see `PHANTOM_READ` conflicts. If it occassionally is not true, we may see `PHANTOM_READ`s appear when a transaction with 
an unexpectedly old transaction timestamp attempts to request a mint while another transaction is fulfilling a mint.

This also means that confirmed transactions written in the previous block could fall within the time frame between now and 1 block timeout in the past. 

Given a hypothetical contrived block timing:

* b1: block one: written at 2,000
  * tx1: TxTime of 500 <-- RequestMint written here
  *    tx2: TxTime of 1900
* b2: block two: written at 4,000
  *    tx1: TxTime of 2,100 <-- FulfillMint executed here
  *    tx2: TxTime of 3,800

b2tx1: 2,100 - 2,000 = 100. This transaction will see neither b1tx1 nor b1tx2. But, our DTO contains the ID of the request we're trying to fulfill, so our range query will start at 500. 
b2tx2: 3,800 - 2,000 = 1,800. This transaction will see b1tx1, but not b1tx2.

* b3: block three: written at 6,000
  *  tx1: TxTime of 5,000
* b4: block four: written at 8,000
  *  tx1: TxTime of 7,500

Additionally, some amount of time may elapse during the ordering and verifying phases. 

By using the Request/Fulfill two-step sequence, we spread fulfillment over at least two separate blocks. 
And becasue the Operations API responds only when block processing has completed, when

Request entries are written with the TxTime as part of the chain key, so they are written in the order received. 
A Submit transaction will receive this key, and calculate its range query such that it contains Request entries 
from at least the prior block or older. 
The Request needs to exist on chain for the Fulfillment step to work. 

The Fulfillment range query will include other Requests written around the same time. 
Chaincode executing on different peers can 
read all the same Request chain objects for a given token in same order. By summing all requested quantities in order, peers can verify that the requested quantity does not exceed the maximum capacity or the maximum supply. 

It's also possible for blocks to be written faster than the block timeout, when they exceed the MaxMessageCount. This does not present a problem for the BlockTimeout-based range query bounding. All executions of the chaincode in a given block will use the same offset. 
And the Fulfill step will play forward the range query of Requests deterministicly in the order they were written, 
using the Request it seeks to fulfill as the starting point. Because the Operations API will not execute the 
Fulfill step until it receives the result of the Request step, chaincode executing the Fulfillment step holds 
confidence that the start key was written in a prior block, avoiding `PHANTOM_READ` conflicts. 


## Transaction Flow

The following illustrates a single user's transactions to 1) Grant a Mint allowance to self and 2) use this Mint allowance 
to mint the token.  This represents two requests to the Gala 
Operations API (which handles the Request/Fulfill sequence transparently for the client), 
and four transactions spread across four separate blocks. 

### Alice -> RequestMintAllowance

**Read:**

`TokenClass`
`TokenMintAllowanceRequest[]` <- by lexigraphic, inverted-time-based key. startKey = minimum one block timeout in the past. The 
    endKey is unbounded. If the token has never been minted, the index space will return no results. If the token has not been minted for 
    a significant amount of time in the recent past, this needs to be accounted for as well. This range query gets the most recent n entries 
    (or no results) and estimates the known mint allowance supply that has been previously granted. 

**Write:**

`TokenMintAllowanceRequest[]` <- timeKey based on Transaction TimeStamp. inverted-time-based lexigraphic key ensures no `PHANTOM_READ`, because the range query read above starts at a later key than generated by the current time stamp. 

**Returns:**

`FulfillMintAllowanceDto`

If the range query of `TokenMintAllowanceRequest` entries determines that the maximum number of mint allowances have already 
been granted, then the method will return an error. Otherwise, it will write new `TokenMintAllowanceRequest` entries that 
record the delta of new allowance quantity or quantities available for use. 

### Alice -> FulfillMintAllowance

dto contains 1-n TokenMintAllowanceRequest identifiers 

**Read:**

`TokenClass` (one or more)
`TokenMintAllowanceRequest[]` <- range query is based on provided TokenMintAllowanceRequest chain objects' values. 
    The start key of the range query will be the key written in the prior contract execution, `RequestMintAllowance`. 
    Our range query will be inclusive of the most recent and the (oldest + n * 1 block timeout) TxTimeStamps of all the requests we are trying to fulfill. 
    All are expected to be at a minimum from the prior block - because this is a two-step sequence method and this is the 2nd step. 
    Our range query includes ALL TokenMintAllowanceRequests in the range, not just the one(s) we are trying to fulfill with our request. 
    This is to account for deltas / quanties incremented by concurrent requests that were written approximate to the 
    request we are seeking to fulfill. 

**Write:**

`TokenMintAllowance[]`
`TokenAllowance[]`

### Alice -> RequestMint

**Read:**

`TokenClass`
`validateMintRequest()` ->
    (optionally) TokenBridge (to check for bridge authority)
    `TokenAllowance[]` (limited by calling user + token key + mint type)
`verifyMintSupply()` -> 
    `TokenMintRequest[]` <- inclusive of (current time offset by 1 block timeout) through oldest possible, iterated through as needed

**Write:**

`TokenMintRequest` (with timeKey based on current TxTimeStamp)


### Alice -> FulfillMint

**Read:**

`TokenClass`
`TokenMintRequest[]` <- same as above, another timeKey range query, inclusive of most recent request through (oldest request + n * 1 block timeout).
    The startKey of the query is provided as input and represents the `TokenMintRequest` entry written in the previous contract 
    execution. 


## Data Structures

`TokenMintAllowanceRequest`
`TokenMintRequest` 

used to get most recent running total.
see `verifyMintAllowanceSupply.ts` and `verifyMintSupply.ts` files. 


## Sequence Operations 

Part of this work involved extending `@gala-chain/api` and `GalaChainTokenContract` to support `sequence` operations. This was necessary 
to support the Request/Fulfill transaction flow. In order to Fulfill a Request, the Request must have been submitted in a valid transaction 
contained in a prior block of the blockchain. 

A `sequence` is defined in the `MethodAPI`. Gala's Operations API detects these sequences. When present, it will sequentially execute the operations 
against the Hyperledger Fabric network before returning a response to the client. Because Gala's Operations API waits for the transaction to 
fully succeed before attempting the next sequence request, we know that the sequence chaincalls will happen in separate blocks. 

Sequences assume that outputs of prior chaincode executions become inputs to later chaincalls in the sequence. 
Subsequent steps depends on the existence of valid, authorized chain entries previously written to world state. 

## Breaking Changes

* Granting allowances of `AllowanceType.Mint` requires using a new contract method. `GrantAllowance` becomes `GrantMintAllowance`. This is because Mints and Mint Allowances use a two-step sequence, and other Allowance Types do not. 
* `HighThroughputMint` is intended to be a one-way migration. Tokens previously minted using non-highthroughput methods should not switch back to legacy methods after migrating to `HighThroughputMint`. 
* Supply and capacity tracking counters stored on the singular `TokenClass` entry will not be incremented during high-throughput operations. These counters should be considered out-of-date and clients/consumers should use methods that fetch the known mint supply. e.g. `FetchTokenClassesWithKnownSupply` vs `FetchTokenClasses`.

## Limitations and Assumptions

The primary limitation revolves around the time stamp manipulation and especially the 
blockTimeout variable. If these variables are not set correctly, or the logic does not 
guarantee that lookups will skip all transactions potentially writing to the same keyspace, `MVCC_READ_CONFLICT` 
or `PHANTOM_READ_CONFLICT` errors could occur. 

This tradeoff is made against prior implementation attempts which did not work nearly as well. 
An alternative is using a pure version of 
the prior art documented above, but they all come with their own set of limitations. And most of these limitations are not ideal 
for a high-throughput, high-user environment (like a limited token sale).

Additionally, malicious clients might attempt to use some kind of timestamp manipulation to game the 
transaction ordering logic, potentially cutting in line in front of other end users. This is somewhat 
mitigated by virtue of traffic flowing through Gala's Operation API, which also handles the rapid 
Request/Fulfill steps on behalf of client users: Requests are not expected to be sitting 
unfilled on chain for more than a couple seconds, and less during high traffic periods. 

The time inverstion horizon is set to several billion years in the future. When GalaChain approaches this time horizon in the distant 
future, we assume that developers at that time will be able to mitigate the problem, 
similar to how the Y2K problem was solved for the year 2000. 