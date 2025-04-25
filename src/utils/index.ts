import type { Chain } from "viem";
import { polygon, polygonMumbai } from "viem/chains";
import { rskChain } from "../lib/constants.js";

export function constructPolygonScanUrl(
  chain: Chain,
  transactionHash: `0x${string}`,
) {
  if (chain.id === polygon.id) {
    return `https://polygonscan.com/tx/${transactionHash}`;
  }

  if (chain.id === polygonMumbai.id) {
    return `https://mumbai.polygonscan.com/tx/${transactionHash}`;
  }

  // Default to mainnet
  return `https://polygonscan.com/tx/${transactionHash}`;
}

export function constructRskScanUrl(
  chain: Chain,
  transactionHash: `0x${string}`,
) {
  // For RSK mainnet
  if (chain.id === rskChain.id) {
    return `https://explorer.rootstock.io//tx/${transactionHash}`;
  }

  // For RSK testnet
  if (chain.id === 31) {
    return `https://explorer.testnet.rootstock.io/tx/${transactionHash}`;
  }

  // Default to testnet
  return `https://explorer.testnet.rootstock.io/tx/${transactionHash}`;
}
