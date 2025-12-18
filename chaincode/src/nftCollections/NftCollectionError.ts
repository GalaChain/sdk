import { ForbiddenError, NotFoundError } from "@gala-chain/api";

export class NftCollectionAuthorizationNotFoundError extends NotFoundError {
  constructor(collection: string) {
    super(`NFT collection authorization for collection "${collection}" does not exist`, {
      collection
    });
  }
}

export class UserNotAuthorizedForCollectionError extends ForbiddenError {
  constructor(user: string, collection: string) {
    super(`User ${user} is not authorized to create NFT collections for collection "${collection}"`, {
      user,
      collection
    });
  }
}

export class CollectionNameMismatchError extends ForbiddenError {
  constructor(requestedCollection: string, authorizedCollection: string) {
    super(
      `Collection name mismatch: requested "${requestedCollection}" but authorization is for "${authorizedCollection}"`,
      {
        requestedCollection,
        authorizedCollection
      }
    );
  }
}
