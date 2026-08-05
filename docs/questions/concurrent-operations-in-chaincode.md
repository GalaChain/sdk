### Question


How do I implement concurrent operations in chaincode?


### Answer

Generally, you won't need to think about how to implement concurrent operations in chaincode. GalaChain provides built-in mechanisms for handling concurrent operations safely. 

This is because Hyperledger Fabric provides built in MVCC (Multi-version concurrency control) and GalaChain builds on top of this framework to provide within-transaction atomicity.

There are other documents covering these topics; be sure to review our [high throughput minting](../high-throughput-minting.md) documentation for a specific example, and [our core concepts](../concepts/mvcc-read-conflicts.md) pages for more information. 

The primary concern for implementing developers is to avoid triggering these built in errors. 

For example, if two separate transactions occuring within the same block tried to write the same user's token balance, one of the transactions would fail with an `MVCC_READ_CONFLICT`. However, retry logic built into the Operations API will retry the failed transaction to a point and this failure may not be apparent to the end user or the implementing developer during times of normal load. 

Key Concepts:

- Generally the SDK is designed to handle concurrency. 
- To succeed, transactions must execute determininsticly across peers. 
- Write conflicts and race conditions are handled by the underlying blockchain technology.

Best Practices:

- Follow guidlines for [chain key design](../concepts/chain-key-design.md), [data modeling](../concepts/facts-not-objects.md), and [create/read/update/delete handling](../concepts/create-read-update-delete.md).
- Avoid data structures, api services, or client applications that could exacerbate the possibility of `MVCC_READ_CONFLICT` errors.
