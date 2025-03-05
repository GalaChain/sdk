import { TokenClassKey } from "@gala-chain/api";

const TOKENS = {
  ETH: {
    name: "Ethereum",
    symbol: "ETH",
    description:
      "Ethereum is a decentralized open-source blockchain system with smart contract functionality.",
    image: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
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
    image: "https://cryptologos.cc/logos/tether-usdt-logo.png",
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
    image: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
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
    image: "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
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
    image: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
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
    image: "https://cryptologos.cc/logos/solana-sol-logo.png",
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
    image: "https://cryptologos.cc/logos/polygon-matic-logo.png",
    KEY: {
      collection: "new-collection0",
      category: "new-category0",
      type: "new-type0",
      additionalKey: "MATIC"
    }
  }
};

export const ETH_ClassKey = Object.assign(new TokenClassKey(), TOKENS.ETH.KEY);
export const USDT_ClassKey = Object.assign(new TokenClassKey(), TOKENS.USDT.KEY);
export const USDC_ClassKey = Object.assign(new TokenClassKey(), TOKENS.USDC.KEY);
export const BTC_ClassKey = Object.assign(new TokenClassKey(), TOKENS.BTC.KEY);
export const BNB_ClassKey = Object.assign(new TokenClassKey(), TOKENS.BNB.KEY);
export const SOL_ClassKey = Object.assign(new TokenClassKey(), TOKENS.SOL.KEY);
export const MATIC_ClassKey = Object.assign(new TokenClassKey(), TOKENS.MATIC.KEY);

export default TOKENS;
