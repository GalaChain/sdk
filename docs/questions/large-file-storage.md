### Question


What's the best way to handle large file storage in chaincode?


### Answer


Large files should not be stored directly in chaincode state. Instead, use off-chain storage and store references in chaincode. Here's how:

1. Document Reference Pattern:
```typescript
class DocumentReference extends ChainObject {
  @Exclude()
  public static readonly INDEX_KEY = 'DOC_REF';

  @ChainKey({ position: 0 })
  @IsUserAlias()
  public readonly owner: UserAlias;

  @ChainKey({ position: 1 })
  @IsString()
  public readonly documentHash: string;  // Hash of the document contents

  @IsString()
  public readonly storageReference: string;  // URL or path to external storage

  @IsNumber()
  public readonly timestamp: number;
}

class DocumentContract extends Contract {
  @Submit()
  async storeDocumentReference(
    ctx: GalaChainContext,
    params: {
      documentHash: string;
      storageReference: string;
    }
  ): Promise<void> {
    const reference = new DocumentReference({
      owner: ctx.callingUser.id,
      documentHash: params.documentHash,
      storageReference: params.storageReference,
      timestamp: Date.now()
    });

    await putChainObject(ctx, reference);
  }
}
```

2. Best Practices:
   - Store large files in external storage (IPFS, S3, etc.)
   - Only store metadata and references on-chain
   - Include file hashes for integrity verification
   - Implement proper access control for external storage
   - Consider file lifecycle management

3. Document Verification:
```typescript
@Evaluate()
async function verifyDocument(
  ctx: GalaChainContext,
  params: {
    documentHash: string;
    content: string;
  }
): Promise<boolean> {
  // Get document reference
  const reference = await getObjectByKey(
    ctx,
    DocumentReference,
    [ctx.callingUser.id, params.documentHash]
  );

  // Verify hash matches
  const computedHash = hashContent(params.content);
  return computedHash === reference.documentHash;
}
```

4. Important Considerations:
   - Keep chaincode state size manageable
   - Implement proper garbage collection
   - Consider data privacy requirements
   - Handle external storage availability
   - Plan for storage cost management

Note: When using external storage, ensure it meets your requirements for availability, durability, and access control. The chaincode should only store what's necessary for verification and access management.