import { ethers } from "ethers";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import type { WalletData, WalletItem } from "../tools/types.js";

export interface WalletSignerOptions {
  testnet?: boolean;
  walletName?: string;
  isExternal?: boolean;
  walletsData?: WalletData;
  password?: string;
}

const walletFilePath = path.join(process.cwd(), "my-wallets.json");

function getRpcUrl(testnet: boolean): string {
  return testnet
    ? "https://public-node.testnet.rsk.co"
    : "https://public-node.rsk.co";
}

async function loadWalletData(options: WalletSignerOptions): Promise<WalletData> {
  if (options.isExternal && options.walletsData) {
    return options.walletsData;
  }

  if (!fs.existsSync(walletFilePath)) {
    throw new Error("No saved wallet found. Please create a wallet first.");
  }

  return JSON.parse(fs.readFileSync(walletFilePath, "utf8"));
}

function getWalletName(walletsData: WalletData, options: WalletSignerOptions): string {
  if (options.walletName) {
    if (!walletsData.wallets[options.walletName]) {
      throw new Error(`Wallet "${options.walletName}" not found`);
    }
    return options.walletName;
  }

  if (!walletsData.currentWallet) {
    throw new Error("No current wallet set. Please select or create a wallet.");
  }

  return walletsData.currentWallet;
}

function decryptPrivateKey(wallet: WalletItem, password?: string): string {
  if (!wallet.encryptedPrivateKey || !wallet.iv) {
    throw new Error("Invalid wallet data: missing encryption information");
  }

  if (!password) {
    throw new Error("Password is required to decrypt wallet");
  }

  try {
    const decipherIv = Uint8Array.from(Buffer.from(wallet.iv, "hex"));
    const key = crypto.scryptSync(password, decipherIv, 32);
    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      Uint8Array.from(key),
      decipherIv
    );

    let decryptedPrivateKey = decipher.update(wallet.encryptedPrivateKey, "hex", "utf8");
    decryptedPrivateKey += decipher.final("utf8");

    return decryptedPrivateKey;
  } catch {
    throw new Error("Failed to decrypt wallet private key. Please check your password.");
  }
}

async function createSigner(options: WalletSignerOptions): Promise<ethers.Signer | null> {
  const walletsData = await loadWalletData(options);

  if (!walletsData.wallets) {
    return null;
  }

  const walletName = getWalletName(walletsData, options);
  const wallet = walletsData.wallets[walletName];

  if (!wallet?.encryptedPrivateKey || !wallet?.iv || !options.password) {
    return null;
  }

  const privateKey = decryptPrivateKey(wallet, options.password);
  const formattedPrivateKey = privateKey.startsWith("0x")
    ? privateKey
    : `0x${privateKey}`;

  const provider = new ethers.JsonRpcProvider(getRpcUrl(!!options.testnet));
  return new ethers.Wallet(formattedPrivateKey, provider);
}

/**
 * Builds an ethers v6 signer from RSK CLI-compatible wallet data (same
 * AES-256-CBC/scrypt encryption scheme used by the wallet/create-wallet tools).
 */
export async function createAttestationSigner(options: WalletSignerOptions = {}): Promise<ethers.Signer | null> {
  try {
    return await createSigner(options);
  } catch {
    return null;
  }
}
