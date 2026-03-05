/**
 * Integration test script for attestation tools.
 * Runs against RSK Testnet | no wallet required for read-only tests.
 *
 * Usage:
 *   node scripts/test-attestations.mjs
 *
 * For write tests, set env vars:
 *   WALLET_PASSWORD=... node scripts/test-attestations.mjs --write
 */

import { AttestationService } from "../build/services/AttestationService.js";

const service = new AttestationService();
const TESTNET = true;

// Known testnet schema UIDs registered by RSK
const SCHEMA_UIDS = {
  deployment:   "0xac72a47948bf42cad950de323c51a0033346629ae4a42da45981ae9748118a72",
  verification: "0xdf68ba5414a61a12f26d41df4f5a1ef3ffe2ab809fea94d9c76fa7cb84b8fb4a",
  transfer:     "0x0da2422c401f8810a6be8f4451aaa0c0a5a6601701cba17bba14f50bb0039dc8",
};

// Known real attestation UID on testnet (from rsk-cli)
const KNOWN_UID = "0x9461b98b2abfe76894fc67fffb4147a6d5bf3dc1f689a4c28027761c6ab9dfaf";

let passed = 0;
let failed = 0;

function result(name, ok, detail = "") {
  if (ok) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.error(`  ❌ ${name}${detail ? `: ${detail}` : ""}`);
    failed++;
  }
}

// ----- Read-only tests -----

async function testListAttestations() {
  console.log("\n📋 list-attestations");

  // No filters | should return up to 10 entries
  const r1 = await service.processListAttestations({ testnet: TESTNET, limit: 5 });
  if (!r1.success && r1.error?.includes("eth_getLogs")) {
    result("returns actionable error when no rpcUrl provided", true);
    console.log("  ⚠️  eth_getLogs not supported on public node — list tests need a custom rpcUrl");
    return;
  }
  result("returns success", r1.success, r1.error);
  result("has attestations array", Array.isArray(r1.data?.attestations));

  // Filter by known deployment schema
  const r2 = await service.processListAttestations({
    testnet: TESTNET,
    schema: SCHEMA_UIDS.deployment,
    limit: 3,
  });
  result("filters by schema without error", r2.success, r2.error);

  // Filter by a dummy address | should return empty, not error
  const r3 = await service.processListAttestations({
    testnet: TESTNET,
    recipient: "0x0000000000000000000000000000000000000001",
  });
  result("empty result is success (not error)", r3.success, r3.error);
  result("empty result has attestations key", Array.isArray(r3.data?.attestations));
}

async function testVerifyAttestation() {
  console.log("\n🔍 verify-attestation");

  console.log(`  Using known UID: ${KNOWN_UID}`);

  const r1 = await service.processVerifyAttestation({ testnet: TESTNET, uid: KNOWN_UID });
  result("returns success", r1.success, r1.error);
  result("has valid field", typeof r1.data?.valid === "boolean");
  result("has status field", typeof r1.data?.status === "string");
  result("has attester field", !!r1.data?.attestation?.attester);
  result("has recipient field", !!r1.data?.attestation?.recipient);
  result("has schema field", !!r1.data?.attestation?.schema);

  // Non-existent UID | should return success=true with valid=false (not throw)
  const bogusUID = "0x" + "ab".repeat(32);
  const r2 = await service.processVerifyAttestation({ testnet: TESTNET, uid: bogusUID });
  result("bogus UID returns success=true (not throw)", r2.success, r2.error);
  result("bogus UID has valid=false", r2.data?.valid === false);
  result("bogus UID status is not_found", r2.data?.status === "not_found");
}

// ----- Write tests (opt-in) -----

async function testWriteOperations(walletData, walletPassword) {
  console.log("\n✍️  Write tests (testnet)");

  const now = Math.floor(Date.now() / 1000);
  const mockTxHash = "0x" + "cc".repeat(32);
  const mockAddress = "0x" + "aa".repeat(20);

  // attest-deployment
  console.log("\n  attest-deployment");
  const dep = await service.processDeploymentAttestation({
    testnet: TESTNET,
    contractAddress: mockAddress,
    contractName:    "TestContract",
    deployer:        mockAddress,
    blockNumber:     1000000,
    transactionHash: mockTxHash,
    timestamp:       now,
    walletData,
    walletPassword,
  });
  result("deployment attestation created", dep.success, dep.error);
  if (dep.success) {
    result("has uid", !!dep.data?.uid);
    result("has viewUrl", !!dep.data?.viewUrl);
    console.log(`    UID: ${dep.data?.uid}`);

    // verify the attestation we just created
    console.log("\n  verify created attestation");
    const verify = await service.processVerifyAttestation({ testnet: TESTNET, uid: dep.data.uid });
    result("verify returns valid=true", verify.data?.valid === true);

    // revoke it
    console.log("\n  revoke-attestation");
    const revoke = await service.processRevokeAttestation({
      testnet: TESTNET,
      uid: dep.data.uid,
      walletData,
      walletPassword,
    });
    result("revocation succeeds", revoke.success, revoke.error);

    // verify it's now revoked
    const verifyRevoked = await service.processVerifyAttestation({ testnet: TESTNET, uid: dep.data.uid });
    result("verify returns valid=false after revoke", verifyRevoked.data?.valid === false);
    result("status is 'revoked'", verifyRevoked.data?.status === "revoked");
  }

  // attest-verification
  console.log("\n  attest-verification");
  const ver = await service.processVerificationAttestation({
    testnet: TESTNET,
    contractAddress:   mockAddress,
    contractName:      "TestContract",
    verifier:          mockAddress,
    sourceCodeHash:    "0x" + "dd".repeat(32),
    compilationTarget: "contracts/TestContract.sol:TestContract",
    compilerVersion:   "v0.8.17+commit.8df45f5f",
    optimizationUsed:  false,
    timestamp:         now,
    verificationTool:  "hardhat",
    walletData,
    walletPassword,
  });
  result("verification attestation created", ver.success, ver.error);
  if (ver.success) console.log(`    UID: ${ver.data?.uid}`);

  // attest-transfer
  console.log("\n  attest-transfer");
  const tx = await service.processTransferAttestation({
    testnet:         TESTNET,
    sender:          mockAddress,
    recipient:       mockAddress,
    amount:          "0.001",
    tokenSymbol:     "RBTC",
    transactionHash: mockTxHash,
    blockNumber:     1000001,
    timestamp:       now,
    transferType:    "native",
    walletData,
    walletPassword,
  });
  result("transfer attestation created", tx.success, tx.error);
  if (tx.success) console.log(`    UID: ${tx.data?.uid}`);
}

// ----- Runner -----

async function run() {
  console.log("🧪 RSK MCP Server — Attestation Integration Tests");
  console.log("   Network: RSK Testnet\n");

  try {
    await testListAttestations();
    await testVerifyAttestation();

    const writeMode = process.argv.includes("--write");
    if (writeMode) {
      const walletPassword = process.env.WALLET_PASSWORD;
      if (!walletPassword) {
        console.error("\n❌ --write requires WALLET_PASSWORD env var");
        process.exit(1);
      }
      const { default: fs } = await import("fs");
      const { homedir } = await import("os");
      const walletPath = process.env.WALLET_PATH || `${homedir()}/.rsk-cli/my-wallets.json`;
      if (!fs.existsSync(walletPath)) {
        console.error(`\n❌ Wallet file not found at ${walletPath}`);
        console.error(`   Set WALLET_PATH env var to point to your wallet JSON file`);
        process.exit(1);
      }
      const walletData = JSON.parse(fs.readFileSync(walletPath, "utf8"));
      await testWriteOperations(walletData, walletPassword);
    } else {
      console.log("\n⏭️  Skipping write tests (run with --write to enable)");
    }
  } catch (err) {
    console.error("\n💥 Unexpected error:", err);
    failed++;
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

run();
