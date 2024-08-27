/*
 * Copyright (c) Gala Games Inc. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { ChainCallDTO, ConstructorArgs, serialize } from "@gala-chain/api";
import {
  BatchMintTokenParams,
  BurnTokensParams,
  CreateTokenClassParams,
  DeleteAllowancesParams,
  FetchAllowancesBody,
  FetchAllowancesParams,
  FetchBalancesParams,
  FetchBalancesWithPaginationParams,
  FetchBalancesWithTokenMetadataBody,
  FetchBurnsParams,
  FetchMintRequestsParams,
  FetchTokenClassesParams,
  FetchTokenClassesResponseBody,
  FetchTokenClassesWithPaginationParams,
  FulfillMintDto,
  FulfillMintParams,
  FullAllowanceCheckParams,
  GalaChainResponse,
  GetMyProfileParams,
  GrantAllowanceParams,
  HighThroughputMintTokenParams,
  LockTokenRequestParams,
  LockTokensParams,
  MintRequestDto,
  MintTokenParams,
  MintTokenWithAllowanceParams,
  RefreshAllowanceParams,
  RegisterUserParams,
  ReleaseTokenParams,
  TokenAllowanceBody,
  TokenBalanceBody,
  TokenBurnBody,
  TokenClassBody,
  TokenClassKeyBody,
  TokenInstanceKey,
  TokenInstanceKeyBody,
  TransferTokenParams,
  UnlockTokenParams,
  UnlockTokensParams,
  UpdatePublicKeyParams,
  UpdateTokenClassParams,
  UseTokenParams,
  UserProfileBody
} from "@gala-chain/api";

import { generateEIP712Types } from "./Utils";
import { CustomClient } from "./types/CustomClient";

export class GalachainClient implements CustomClient {
  constructor(private features: CustomClient) {}

  async connect(): Promise<string> {
    return this.features.connect();
  }

  async sign<U extends ConstructorArgs<ChainCallDTO>>(
    method: string,
    dto: U
  ): Promise<U & { signature: string; prefix: string }> {
    return this.features.sign(method, dto);
  }

  getGalachainAddress = this.features.getGalachainAddress;
  getWalletAddress = this.features.getWalletAddress;
  setWalletAddress = this.features.setWalletAddress;
  getChaincodeUrl = this.features.getChaincodeUrl;

  async submit<T, U extends ConstructorArgs<ChainCallDTO>>({
    url = this.getChaincodeUrl,
    method,
    payload,
    sign = false,
    headers = {}
  }: {
    url?: string;
    method: string;
    payload: U;
    sign?: boolean;
    headers?: object;
  }): Promise<T> {
    let newPayload = payload;

    if (sign === true) {
      try {
        newPayload = await this.sign(method, payload);
      } catch (error: unknown) {
        throw new Error((error as Error).message);
      }
    }

    if (newPayload instanceof ChainCallDTO) {
      await newPayload.validateOrReject();
    }

    const fullUrl = `${url}/${method}`;
    const response = await fetch(fullUrl, {
      method: "POST",
      body: serialize(newPayload),
      headers: {
        "Content-Type": "application/json",
        ...headers
      }
    });

    const id = response.headers.get("x-transaction-id");
    const data = await response.json();

    if (data.error) {
      return data.error;
    }

    return Promise.resolve(id ? { Hash: id, ...data } : data);
  }

  // PublicKey Chaincode calls:
  public GetMyProfile(dto: GetMyProfileParams) {
    return this.submit<UserProfileBody, GetMyProfileParams>({
      method: "GetMyProfile",
      payload: dto,
      sign: true
    });
  }

  public RegisterUser(dto: RegisterUserParams) {
    return this.submit<string, RegisterUserParams>({
      method: "RegisterUser",
      payload: dto,
      sign: true
    });
  }

  public RegisterEthUser(dto: RegisterUserParams) {
    return this.submit<string, RegisterUserParams>({
      method: "RegisterEthUser",
      payload: dto,
      sign: true
    });
  }

  public UpdatePublicKey(dto: UpdatePublicKeyParams) {
    return this.submit<void, UpdatePublicKeyParams>({
      method: "UpdatePublicKey",
      payload: dto,
      sign: true
    });
  }

  // Token Chaincode Calls:
  public CreateTokenClass(dto: CreateTokenClassParams) {
    return this.submit<GalaChainResponse<TokenClassKeyBody>, CreateTokenClassParams>({
      method: "CreateTokenClass",
      payload: dto,
      sign: true
    });
  }

  public UpdateTokenClass(dto: UpdateTokenClassParams) {
    return this.submit<GalaChainResponse<TokenClassKeyBody>, UpdateTokenClassParams>({
      method: "UpdateTokenClass",
      payload: dto,
      sign: true
    });
  }

  public FetchTokenClasses(dto: FetchTokenClassesParams) {
    return this.submit<GalaChainResponse<TokenClassBody[]>, FetchTokenClassesParams>({
      method: "FetchTokenClasses",
      payload: dto
    });
  }

  public FetchTokenClassesWithPagination(dto: FetchTokenClassesWithPaginationParams) {
    return this.submit<
      GalaChainResponse<FetchTokenClassesResponseBody>,
      FetchTokenClassesWithPaginationParams
    >({
      method: "FetchTokenClassesWithPagination",
      payload: dto
    });
  }

  public GrantAllowance(dto: GrantAllowanceParams) {
    return this.submit<GalaChainResponse<TokenAllowanceBody[]>, GrantAllowanceParams>({
      method: "GrantAllowance",
      payload: dto,
      sign: true
    });
  }

  public RefreshAllowances(dto: RefreshAllowanceParams) {
    return this.submit<GalaChainResponse<TokenAllowanceBody[]>, RefreshAllowanceParams>({
      method: "RefreshAllowances",
      payload: dto,
      sign: true
    });
  }

  public FullAllowanceCheck(dto: FullAllowanceCheckParams) {
    return this.submit<GalaChainResponse<FullAllowanceCheckParams>, FullAllowanceCheckParams>({
      method: "FullAllowanceCheck",
      payload: dto,
      sign: true
    });
  }

  public FetchAllowances(dto: FetchAllowancesParams) {
    return this.submit<GalaChainResponse<FetchAllowancesBody>, FetchAllowancesParams>({
      method: "FetchAllowances",
      payload: dto,
      sign: true
    });
  }

  public DeleteAllowances(dto: DeleteAllowancesParams) {
    return this.submit<GalaChainResponse<number>, DeleteAllowancesParams>({
      method: "DeleteAllowances",
      payload: dto,
      sign: true
    });
  }

  public FetchBalances(dto: FetchBalancesParams) {
    return this.submit<GalaChainResponse<TokenBalanceBody[]>, FetchBalancesParams>({
      method: "FetchBalances",
      payload: dto
    });
  }

  public FetchBalancesWithTokenMetadata(dto: FetchBalancesWithPaginationParams) {
    return this.submit<
      GalaChainResponse<FetchBalancesWithTokenMetadataBody>,
      FetchBalancesWithPaginationParams
    >({
      method: "FetchBalancesWithTokenMetadata",
      payload: dto
    });
  }

  public RequestMint(dto: HighThroughputMintTokenParams) {
    // todo: Is fulfillMintDto really the response here?
    return this.submit<GalaChainResponse<FulfillMintDto>, HighThroughputMintTokenParams>({
      method: "RequestMint",
      payload: dto,
      sign: true
    });
  }

  public FulfillMint(dto: FulfillMintParams) {
    return this.submit<GalaChainResponse<TokenInstanceKeyBody[]>, FulfillMintParams>({
      method: "FulfillMint",
      payload: dto,
      sign: true
    });
  }

  public HighThroughputMint(dto: HighThroughputMintTokenParams) {
    return this.submit<GalaChainResponse<TokenInstanceKeyBody[]>, HighThroughputMintTokenParams>({
      method: "HighThroughputMint",
      payload: dto,
      sign: true
    });
  }

  public FetchMintRequests(dto: FetchMintRequestsParams) {
    return this.submit<GalaChainResponse<MintRequestDto[]>, FetchMintRequestsParams>({
      method: "FetchMintRequests",
      payload: dto
    });
  }

  public MintToken(dto: MintTokenParams) {
    return this.submit<GalaChainResponse<TokenInstanceKeyBody[]>, MintTokenParams>({
      method: "MintToken",
      payload: dto,
      sign: true
    });
  }

  public MintTokenWithAllowance(dto: MintTokenWithAllowanceParams) {
    return this.submit<GalaChainResponse<TokenInstanceKey[]>, MintTokenWithAllowanceParams>({
      method: "MintTokenWithAllowance",
      payload: dto,
      sign: true
    });
  }

  public BatchMintToken(dto: BatchMintTokenParams) {
    return this.submit<GalaChainResponse<TokenInstanceKeyBody[]>, BatchMintTokenParams>({
      method: "BatchMintToken",
      payload: dto,
      sign: true
    });
  }

  public UseToken(dto: UseTokenParams) {
    return this.submit<GalaChainResponse<TokenBalanceBody>, UseTokenParams>({
      method: "UseToken",
      payload: dto,
      sign: true
    });
  }

  public ReleaseToken(dto: ReleaseTokenParams) {
    return this.submit<GalaChainResponse<TokenBalanceBody>, ReleaseTokenParams>({
      method: "ReleaseToken",
      payload: dto,
      sign: true
    });
  }

  public LockToken(dto: LockTokenRequestParams) {
    return this.submit<GalaChainResponse<TokenBalanceBody>, LockTokenRequestParams>({
      method: "LockToken",
      payload: dto,
      sign: true
    });
  }

  public LockTokens(dto: LockTokensParams) {
    return this.submit<GalaChainResponse<TokenBalanceBody[]>, LockTokensParams>({
      method: "LockTokens",
      payload: dto,
      sign: true
    });
  }

  public UnlockToken(dto: UnlockTokenParams) {
    return this.submit<GalaChainResponse<TokenBalanceBody>, UnlockTokenParams>({
      method: "UnlockToken",
      payload: dto,
      sign: true
    });
  }

  public UnlockTokens(dto: UnlockTokensParams) {
    return this.submit<GalaChainResponse<TokenBalanceBody[]>, UnlockTokensParams>({
      method: "UnlockTokens",
      payload: dto,
      sign: true
    });
  }

  public TransferToken(dto: TransferTokenParams) {
    return this.submit<GalaChainResponse<TokenBalanceBody[]>, TransferTokenParams>({
      method: "TransferToken",
      payload: dto,
      sign: true
    });
  }

  public BurnTokens(dto: BurnTokensParams) {
    return this.submit<GalaChainResponse<TokenBurnBody[]>, BurnTokensParams>({
      method: "BurnTokens",
      payload: dto,
      sign: true
    });
  }

  public FetchBurns(dto: FetchBurnsParams) {
    return this.submit<GalaChainResponse<TokenBurnBody[]>, FetchBurnsParams>({
      method: "FetchBurns",
      payload: dto
    });
  }
}
