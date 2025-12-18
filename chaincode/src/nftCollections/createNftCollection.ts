import { CreateTokenClassDto, TokenClassKey, NftCollectionAuthorization, CreateNftCollectionDto } from "@gala-chain/api";
import { GalaChainContext, createTokenClass, resolveUserAlias } from "@gala-chain/chaincode";

import {
  CollectionNameMismatchError,
  NftCollectionAuthorizationNotFoundError,
  UserNotAuthorizedForCollectionError
} from "./NftCollectionError";
import { fetchNftCollectionAuthorization } from "./authorization";

export async function createNftCollection(
  ctx: GalaChainContext,
  dto: CreateNftCollectionDto
): Promise<TokenClassKey> {
  // Fetch authorization to verify user is authorized and get the authorized collection name
  const callingUser = ctx.callingUser;
  let authorization: NftCollectionAuthorization;
  try {
    authorization = await fetchNftCollectionAuthorization(ctx, dto.collection);
  } catch (e) {
    throw new NftCollectionAuthorizationNotFoundError(dto.collection);
  }

  // Verify user is in the authorized users list
  if (!authorization.authorizedUsers.includes(ctx.callingUser)) {
    throw new UserNotAuthorizedForCollectionError(ctx.callingUser, dto.collection);
  }

  // Verify collection name matches the authorized collection name
  if (authorization.collection !== dto.collection) {
    throw new CollectionNameMismatchError(dto.collection, authorization.collection);
  }

  // Create TokenClassKey with collection name from authorization (override any provided in DTO)
  const tokenClass = new TokenClassKey();
  tokenClass.collection = authorization.collection; // Always use the authorized collection name
  tokenClass.category = dto.category;
  tokenClass.type = dto.type;
  tokenClass.additionalKey = dto.additionalKey;

  // Resolve authorities if provided
  const authorities = dto.authorities
    ? await Promise.all(dto.authorities.map((a) => resolveUserAlias(ctx, a)))
    : [ctx.callingUser];

  // Call createTokenClass with NFT-specific defaults
  return await createTokenClass(ctx, {
    network: "GC",
    tokenClass,
    isNonFungible: true, // Always NFT
    decimals: 0, // Always 0 decimals for NFTs
    name: dto.name,
    symbol: dto.symbol,
    description: dto.description,
    rarity: dto.rarity,
    image: dto.image,
    metadataAddress: dto.metadataAddress,
    contractAddress: dto.contractAddress,
    maxSupply: dto.maxSupply ?? CreateTokenClassDto.DEFAULT_MAX_SUPPLY,
    maxCapacity: dto.maxCapacity ?? CreateTokenClassDto.DEFAULT_MAX_CAPACITY,
    totalMintAllowance: CreateTokenClassDto.INITIAL_MINT_ALLOWANCE,
    totalSupply: CreateTokenClassDto.INITIAL_TOTAL_SUPPLY,
    totalBurned: CreateTokenClassDto.INITIAL_TOTAL_BURNED,
    authorities
  });
}
