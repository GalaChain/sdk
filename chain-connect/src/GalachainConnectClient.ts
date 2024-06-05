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
import {
  BatchMintTokenDto,
  BurnTokensDto,
  ChainCallDTO,
  CreateTokenClassDto,
  DeleteAllowancesDto,
  FetchAllowancesDto,
  FetchBalancesDto,
  FetchBurnsDto,
  FetchMintRequestsDto,
  FetchTokenClassesDto,
  FetchTokenClassesWithPaginationDto,
  FulfillMintDto,
  FullAllowanceCheckDto,
  GetMyProfileDto,
  GrantAllowanceDto,
  HighThroughputMintTokenDto,
  LockTokenDto,
  LockTokensDto,
  MintTokenDto,
  MintTokenWithAllowanceDto,
  RefreshAllowanceDto,
  RegisterEthUserDto,
  RegisterUserDto,
  ReleaseTokenDto,
  TransferTokenDto,
  UnlockTokenDto,
  UnlockTokensDto,
  UpdatePublicKeyDto,
  UpdateTokenClassDto,
  UseTokenDto,
  serialize,
  signatures
} from "@gala-chain/api";
import { BrowserProvider, Eip1193Provider } from "ethers";

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

export class GalachainConnectClient {
  private address: string;
  private provider: BrowserProvider | undefined;

  public createPublicKeyClient(url: string) {
    return new PublicKeyClient(this, url);
  }

  public createTokenClient(url: string) {
    return new TokenClient(this, url);
  }

  public async connectToMetaMask() {
    if (!window.ethereum) {
      throw new Error("Ethereum provider not found");
    }

    this.provider = new BrowserProvider(window.ethereum);

    try {
      const accounts = (await this.provider.send("eth_requestAccounts", [])) as string[];
      this.address = accounts[0];
      return this.address;
    } catch (error: unknown) {
      throw new Error((error as Error).message);
    }
  }

  public async sendTransaction(chaincodeUrl: string, method: string, payload: object): Promise<object> {
    if (!this.provider) {
      throw new Error("Ethereum provider not found");
    }
    if (!this.address) {
      throw new Error("No account connected");
    }

    try {
      const prefix = this.calculatePersonalSignPrefix(payload);
      const prefixedPayload = { ...payload, prefix };
      const dto = signatures.getPayloadToSign(prefixedPayload);

      const signer = await this.provider.getSigner();
      const signature = await signer.provider.send("personal_sign", [this.address, dto]);

      return await this.submit(chaincodeUrl, method, { ...prefixedPayload, signature });
    } catch (error: unknown) {
      throw new Error((error as Error).message);
    }
  }

  public async submit(
    chaincodeUrl: string,
    method: string,
    signedPayload: Record<string, unknown>
  ): Promise<object> {
    if (signedPayload instanceof ChainCallDTO) {
      await signedPayload.validateOrReject();
    }

    // Note: GalaChain Uri maybe should be constructed based on channel and method,
    // rather than passing full url as arg
    // ie `${baseUri}/api/${channel}/token-contract/${method}`
    const url = `${chaincodeUrl}/${method}`;
    const response = await fetch(url, {
      method: "POST",
      body: serialize(signedPayload),
      headers: {
        "Content-Type": "application/json"
      }
    });

    const id = response.headers.get("x-transaction-id");
    const data = await response.json();

    if (data.error) {
      return data.error;
    }

    return id ? { Hash: id, ...data } : data;
  }

  private calculatePersonalSignPrefix(payload: object): string {
    const payloadLength = signatures.getPayloadToSign(payload).length;
    const prefix = "\u0019Ethereum Signed Message:\n" + payloadLength;

    const newPayload = { ...payload, prefix };
    const newPayloadLength = signatures.getPayloadToSign(newPayload).length;

    if (payloadLength === newPayloadLength) {
      return prefix;
    }
    return this.calculatePersonalSignPrefix(newPayload);
  }
}

export class PublicKeyClient {
  constructor(
    private client: GalachainConnectClient,
    private url: string
  ) {}

  public updateUrl(url: string) {
    this.url = url;
  }

  public GetMyProfile(dto: GetMyProfileDto) {
    return this.client.sendTransaction(this.url, "GetMyProfile", dto);
  }

  public RegisterUser(dto: RegisterUserDto) {
    return this.client.sendTransaction(this.url, "RegisterUser", dto);
  }

  public RegisterEthUser(dto: RegisterEthUserDto) {
    return this.client.sendTransaction(this.url, "RegisterEthUser", dto);
  }

  public UpdatePublicKey(dto: UpdatePublicKeyDto) {
    return this.client.sendTransaction(this.url, "UpdatePublicKey", dto);
  }
}

export class TokenClient {
  constructor(
    private client: GalachainConnectClient,
    private url: string
  ) {}

  public updateUrl(url: string) {
    this.url = url;
  }

  public CreateTokenClass(dto: CreateTokenClassDto) {
    return this.client.sendTransaction(this.url, "CreateTokenClass", dto);
  }

  public UpdateTokenClass(dto: UpdateTokenClassDto) {
    return this.client.sendTransaction(this.url, "UpdateTokenClass", dto);
  }

  public FetchTokenClasses(dto: FetchTokenClassesDto) {
    return this.client.sendTransaction(this.url, "FetchTokenClasses", dto);
  }

  public FetchTokenClassesWithPagination(dto: FetchTokenClassesWithPaginationDto) {
    return this.client.sendTransaction(this.url, "FetchTokenClassesWithPagination", dto);
  }

  public GrantAllowance(dto: GrantAllowanceDto) {
    return this.client.sendTransaction(this.url, "GrantAllowance", dto);
  }

  public RefreshAllowances(dto: RefreshAllowanceDto) {
    return this.client.sendTransaction(this.url, "RefreshAllowances", dto);
  }

  public FullAllowanceCheck(dto: FullAllowanceCheckDto) {
    return this.client.sendTransaction(this.url, "FullAllowanceCheck", dto);
  }

  public FetchAllowances(dto: FetchAllowancesDto) {
    return this.client.sendTransaction(this.url, "FetchAllowances", dto);
  }

  public DeleteAllowances(dto: DeleteAllowancesDto) {
    return this.client.sendTransaction(this.url, "DeleteAllowances", dto);
  }

  public FetchBalances(dto: FetchBalancesDto) {
    return this.client.sendTransaction(this.url, "FetchBalances", dto);
  }

  public RequestMint(dto: HighThroughputMintTokenDto) {
    return this.client.sendTransaction(this.url, "RequestMint", dto);
  }

  public FulfillMint(dto: FulfillMintDto) {
    return this.client.sendTransaction(this.url, "FulfillMint", dto);
  }

  public HighThroughputMint(dto: HighThroughputMintTokenDto) {
    return this.client.sendTransaction(this.url, "HighThroughputMint", dto);
  }

  public FetchMintRequests(dto: FetchMintRequestsDto) {
    return this.client.sendTransaction(this.url, "FetchMintRequests", dto);
  }

  public MintToken(dto: MintTokenDto) {
    return this.client.sendTransaction(this.url, "MintToken", dto);
  }

  public MintTokenWithAllowance(dto: MintTokenWithAllowanceDto) {
    return this.client.sendTransaction(this.url, "MintTokenWithAllowance", dto);
  }

  public BatchMintToken(dto: BatchMintTokenDto) {
    return this.client.sendTransaction(this.url, "BatchMintToken", dto);
  }

  public UseToken(dto: UseTokenDto) {
    return this.client.sendTransaction(this.url, "UseToken", dto);
  }

  public ReleaseToken(dto: ReleaseTokenDto) {
    return this.client.sendTransaction(this.url, "ReleaseToken", dto);
  }

  public LockToken(dto: LockTokenDto) {
    return this.client.sendTransaction(this.url, "LockToken", dto);
  }

  public LockTokens(dto: LockTokensDto) {
    return this.client.sendTransaction(this.url, "LockTokens", dto);
  }

  public UnlockToken(dto: UnlockTokenDto) {
    return this.client.sendTransaction(this.url, "UnlockToken", dto);
  }

  public UnlockTokens(dto: UnlockTokensDto) {
    return this.client.sendTransaction(this.url, "UnlockTokens", dto);
  }

  public TransferToken(dto: TransferTokenDto) {
    return this.client.sendTransaction(this.url, "TransferToken", dto);
  }

  public BurnTokens(dto: BurnTokensDto) {
    return this.client.sendTransaction(this.url, "BurnTokens", dto);
  }

  public FetchBurns(dto: FetchBurnsDto) {
    return this.client.sendTransaction(this.url, "FetchBurns", dto);
  }
}
