import type { Chain } from "viem";
import { rootstock, rootstockTestnet } from "viem/chains";

export function constructRskScanUrl(
  chain: Chain,
  transactionHash: `0x${string}`,
) {
  if (chain.id === rootstock.id) {
    return `https://explorer.rsk.co/tx/${transactionHash}`;
  }

  if (chain.id === rootstockTestnet.id) {
    return `https://explorer.testnet.rsk.co/tx/${transactionHash}`;
  }

  // Default to mainnet
  return `https://explorer.rsk.co/tx/${transactionHash}`;
}
