### Question


What's the difference between fungible and non-fungible token swaps in GalaChain?


### Answer


Fungible and non-fungible token (NFT) swaps in GalaChain have distinct characteristics and implementation requirements. Here are the key differences:

1. Token Identification:
   - Fungible Tokens:
     - Identified by token type/ID only
     - Quantities are interchangeable
     - Balance-based tracking
   - Non-Fungible Tokens:
     - Each token has a unique identifier
     - Individual token tracking
     - Specific instance transfers

2. Implementation Example:
```typescript
class TokenSwapContract extends Contract {
  // Fungible token swap
  @Submit()
  async swapFungibleTokens(
    ctx: GalaChainContext,
    params: {
      offeredTokenId: string,
      offeredAmount: number,
      requestedTokenId: string,
      requestedAmount: number
    }
  ): Promise<void> {
    // Balance-based validation
    const balance = await getTokenBalance(ctx, ctx.callingUser, params.offeredTokenId);
    if (balance.lt(params.offeredAmount)) {
      throw new Error('Insufficient balance');
    }
    // ... rest of swap logic
  }

  // NFT swap
  @Submit()
  async swapNFTs(
    ctx: GalaChainContext,
    params: {
      offeredNFTId: string,  // Specific NFT instance
      requestedNFTId: string  // Specific NFT instance
    }
  ): Promise<void> {
    // Ownership validation
    const nft = await getNFTById(ctx, params.offeredNFTId);
    if (nft.owner !== ctx.callingUser) {
      throw new Error('Not the owner of NFT');
    }

    // Validate NFT properties
    await this.validateNFTAttributes(ctx, params.offeredNFTId, params.requestedNFTId);
    // ... rest of swap logic
  }

  // Hybrid swap (NFT for fungible tokens)
  @Submit()
  async swapNFTForTokens(
    ctx: GalaChainContext,
    params: {
      nftId: string,
      tokenId: string,
      tokenAmount: number
    }
  ): Promise<void> {
    // Combined validation
    await Promise.all([
      this.validateNFTOwnership(ctx, params.nftId),
      this.validateTokenBalance(ctx, params.tokenId, params.tokenAmount)
    ]);
    // ... rest of swap logic
  }
}
```

3. Key Differences in Implementation:
   - Validation:
     - Fungible: Balance and quantity checks
     - NFT: Ownership and uniqueness verification
   - Transfer Logic:
     - Fungible: Amount-based transfers
     - NFT: Instance-based transfers
   - State Management:
     - Fungible: Update balances
     - NFT: Transfer ownership records

4. Additional Considerations:
   - NFT Metadata Handling
   - Collection Validation
   - Attribute Matching
   - Transfer Restrictions
   - Royalty Handling

Note: The GalaChain SDK provides built-in support for both fungible and non-fungible token swaps through its swap contracts. Always use the SDK's implementation when possible as it handles many edge cases and security considerations.