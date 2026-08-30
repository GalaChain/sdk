### Question


How do I store and query data in chaincode?


### Answer


To store and query data in GalaChain chaincode, follow these steps:

1. First, create a class that extends `ChainObject` and define your data structure:
```typescript
import { ChainObject, ChainKey, IsNotEmpty, IsUserAlias } from '@gala-chain/api';

export class MyData extends ChainObject {
  @Exclude()
  public static readonly INDEX_KEY = 'MYDATA';  // Used for queries

  @ChainKey({ position: 0 })  // Order matters for queries
  @IsUserAlias()
  public readonly owner: UserAlias;

  @ChainKey({ position: 1 })
  @IsNotEmpty()
  public readonly dataType: string;

  // Add other properties as needed
  public readonly value: string;
}
```

2. Store data using `putChainObject`:
```typescript
async function storeData(ctx: GalaChainContext, data: MyData): Promise<void> {
  // Validates and writes to state
  await putChainObject(ctx, data);
}
```

3. Query data using composite keys:
```typescript
async function queryByOwner(
  ctx: GalaChainContext,
  owner: UserAlias
): Promise<MyData[]> {
  // Query by partial key (owner)
  return getObjectsByPartialCompositeKey(
    ctx,
    MyData.INDEX_KEY,  // The index key defined in class
    [owner],          // Partial key attributes
    MyData            // Constructor for deserialization
  );
}
```

4. For large result sets, use pagination:
```typescript
async function queryWithPagination(
  ctx: GalaChainContext,
  owner: UserAlias,
  pageSize: number,
  bookmark: string
) {
  return getObjectsByPartialCompositeKeyWithPagination(
    ctx,
    MyData.INDEX_KEY,
    [owner],
    MyData,
    pageSize,
    bookmark
  );
}
```

Key points:
- Use `@ChainKey` decorators to define composite key parts
- Order of `@ChainKey` positions affects query capabilities
- Use `putChainObject` for validation and storage
- Use `getObjectsByPartialCompositeKey` for queries
- Consider pagination for large result sets