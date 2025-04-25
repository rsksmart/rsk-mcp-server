// USDC on RSK Mainnet
export const USDC_ADDRESS = "0x1Db2466d9F5e10D7090E7152B68d62703a2245F0";
export const USDC_DECIMALS = 18;

// RSK network details
export const RSK_RPC_URL = "https://public-node.rsk.co";
export const RSK_CHAIN_ID = 30;

// RSK Chain Configuration
export const rskChain = {
  id: RSK_CHAIN_ID,
  name: 'RSK Mainnet',
  network: 'rsk',
  nativeCurrency: {
    decimals: 18,
    name: 'RSK Bitcoin',
    symbol: 'RBTC',
  },
  rpcUrls: {
    default: { http: [RSK_RPC_URL] },
    public: { http: [RSK_RPC_URL] },
  },
  blockExplorers: {
    default: { name: 'RSK Explorer', url: 'https://explorer.rsk.co' },
  },
} as const;
