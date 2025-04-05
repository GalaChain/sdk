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
import { TokenClassKey } from "@gala-chain/api";

const TOKENS = {
  ETH: {
    name: "Ethereum",
    symbol: "ETH",
    description:
      "Ethereum is a decentralized open-source blockchain system with smart contract functionality.",
    image: "https://logosite.com/logos/ethereum-eth-logo.png",
    KEY: {
      collection: "new-collection0",
      category: "new-category0",
      type: "new-type0",
      additionalKey: "ETH"
    }
  },
  USDT: {
    name: "Tether",
    symbol: "USDT",
    description:
      "Tether (USDT) is a stablecoin pegged to the US dollar, widely used for trading and transactions.",
    image: "https://logosite.com/logos/tether-usdt-logo.png",
    KEY: {
      collection: "new-collection0",
      category: "new-category0",
      type: "new-type0",
      additionalKey: "USDT"
    }
  },
  USDC: {
    name: "USD Coin",
    symbol: "USDC",
    description: "USD Coin (USDC) is a fully-backed stablecoin issued by regulated financial institutions.",
    image: "https://logosite.com/logos/usd-coin-usdc-logo.png",
    KEY: {
      collection: "new-collection0",
      category: "new-category0",
      type: "new-type0",
      additionalKey: "USDC"
    }
  },
  BTC: {
    name: "Bitcoin",
    symbol: "BTC",
    description:
      "Bitcoin is the first decentralized digital currency, enabling peer-to-peer transactions worldwide.",
    image: "https://logosite.com/logos/bitcoin-btc-logo.png",
    KEY: {
      collection: "new-collection0",
      category: "new-category0",
      type: "new-type0",
      additionalKey: "BTC"
    }
  },
  BNB: {
    name: "Binance Coin",
    symbol: "BNB",
    description: "BNB is the native token of Binance, used for trading fee discounts and various utilities.",
    image: "https://logosite.com/logos/binance-coin-bnb-logo.png",
    KEY: {
      collection: "new-collection0",
      category: "new-category0",
      type: "new-type0",
      additionalKey: "BNB"
    }
  },
  SOL: {
    name: "Solana",
    symbol: "SOL",
    description:
      "Solana is a high-performance blockchain supporting smart contracts and decentralized applications.",
    image: "https://logosite.com/logos/solana-sol-logo.png",
    KEY: {
      collection: "new-collection0",
      category: "new-category0",
      type: "new-type0",
      additionalKey: "SOL"
    }
  },
  MATIC: {
    name: "Polygon",
    symbol: "MATIC",
    description:
      "Polygon is a layer-2 scaling solution that enhances Ethereum's scalability and transaction speed.",
    image: "https://logosite.com/logos/polygon-matic-logo.png",
    KEY: {
      collection: "new-collection0",
      category: "new-category0",
      type: "new-type0",
      additionalKey: "MATIC"
    }
  }
};

export const ethClassKey= Object.assign(new TokenClassKey(), TOKENS.ETH.KEY);
export const usdtClassKey = Object.assign(new TokenClassKey(), TOKENS.USDT.KEY);
export const usdcClassKey = Object.assign(new TokenClassKey(), TOKENS.USDC.KEY);
export const btcClassKey = Object.assign(new TokenClassKey(), TOKENS.BTC.KEY);
export const bnbClassKey = Object.assign(new TokenClassKey(), TOKENS.BNB.KEY);
export const solClassKey = Object.assign(new TokenClassKey(), TOKENS.SOL.KEY);
export const maticClassKey = Object.assign(new TokenClassKey(), TOKENS.MATIC.KEY);

export default TOKENS;
