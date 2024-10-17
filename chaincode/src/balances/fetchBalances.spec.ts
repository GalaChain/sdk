import { FetchBalancesDto, TokenBalance, createValidDTO } from "@gala-chain/api";
import { currency, fixture, transactionSuccess, users } from "@gala-chain/test";
import BigNumber from "bignumber.js";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";

it("should fetch balances by user alias", async () => {
  // Given
  const user = users.testUser1;
  const balance = new TokenBalance({ ...currency.tokenClassKey(), owner: user.identityKey });
  balance.ensureCanAddQuantity(new BigNumber(1000)).add();

  const { contract, ctx } = fixture(GalaChainTokenContract).registeredUsers(user).savedState(balance);

  const dto = await createValidDTO(FetchBalancesDto, { owner: user.identityKey });

  // When
  const result = await contract.FetchBalances(ctx, dto);

  // Then
  expect(result).toEqual(transactionSuccess([balance]));
});

it("should fetch balances by empty signed dto", async () => {
  // Given
  const user = users.testUser1;
  const balance = new TokenBalance({ ...currency.tokenClassKey(), owner: user.identityKey });
  balance.ensureCanAddQuantity(new BigNumber(1000)).add();

  const { contract, ctx } = fixture(GalaChainTokenContract).registeredUsers(user).savedState(balance);

  const dto = await createValidDTO(FetchBalancesDto, {}).signed(user.privateKey);

  // When
  const result = await contract.FetchBalances(ctx, dto);

  // Then
  expect(result).toEqual(transactionSuccess([balance]));
});

it("should fetch balances by any user ref", async () => {
  // Given
  const user = users.testUser1;
  const balance = new TokenBalance({ ...currency.tokenClassKey(), owner: user.identityKey });
  balance.ensureCanAddQuantity(new BigNumber(1000)).add();

  const { contract, ctx } = fixture(GalaChainTokenContract).registeredUsers(user).savedState(balance);

  const dto1 = await createValidDTO(FetchBalancesDto, { owner: user.identityKey });
  const dto2 = await createValidDTO(FetchBalancesDto, { owner: user.ethAddress });
  const dto3 = await createValidDTO(FetchBalancesDto, { owner: user.ethAddress.toLowerCase() });
  const dto4 = await createValidDTO(FetchBalancesDto, { owner: `0x${user.ethAddress}` });

  // When
  const result1 = await contract.FetchBalances(ctx, dto1);
  const result2 = await contract.FetchBalances(ctx, dto2);
  const result3 = await contract.FetchBalances(ctx, dto3);
  const result4 = await contract.FetchBalances(ctx, dto4);

  // Then
  expect(result1).toEqual(transactionSuccess([balance]));
  expect(result2).toEqual(transactionSuccess([balance]));
  expect(result3).toEqual(transactionSuccess([balance]));
  expect(result4).toEqual(transactionSuccess([balance]));
});
