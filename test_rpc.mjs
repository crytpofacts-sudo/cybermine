import { JsonRpcProvider, Contract } from "ethers";

const STAKING = "0xBa75A1CDAD9E5fF1218561f039b80D465A37723e";
const ABI = [
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUser",
    outputs: [
      { name: "activeLp", type: "uint256" },
      { name: "pendingLp", type: "uint256" },
      { name: "lastClaimTs", type: "uint256" },
      { name: "referrer", type: "address" },
      { name: "referralWeightCreditFp", type: "uint256" },
      { name: "referralCount", type: "uint256" },
      { name: "joined", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "feeWei",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "paused",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalBaseWeightFp",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "remainingSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "cooldownSeconds",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

// Test with a known address - use the contract deployer or any address that has joined
// We'll test with a zero address first to see the default, then you can provide your address
const TEST_ADDR = "0x0000000000000000000000000000000000000001"; // placeholder

const RPCS = [
  "https://data-seed-prebsc-1-s1.binance.org:8545/",
  "https://data-seed-prebsc-2-s1.binance.org:8545/",
  "https://data-seed-prebsc-1-s2.binance.org:8545/",
  "https://bsc-testnet-rpc.publicnode.com",
  "https://bsc-testnet.public.blastapi.io",
  "https://endpoints.omniatech.io/v1/bsc/testnet/public",
  "https://bsc-testnet.blockpi.network/v1/rpc/public",
];

async function testRpc(url, label) {
  const start = Date.now();
  try {
    const provider = new JsonRpcProvider(url, 97);
    const contract = new Contract(STAKING, ABI, provider);
    
    // Test 1: Simple call - feeWei
    const fee = await contract.feeWei();
    const t1 = Date.now() - start;
    
    // Test 2: getUser call
    const start2 = Date.now();
    const user = await contract.getUser(TEST_ADDR);
    const t2 = Date.now() - start2;
    
    // Test 3: protocol data
    const start3 = Date.now();
    const [paused, weight, supply, cooldown] = await Promise.all([
      contract.paused(),
      contract.totalBaseWeightFp(),
      contract.remainingSupply(),
      contract.cooldownSeconds(),
    ]);
    const t3 = Date.now() - start3;
    
    console.log(`✅ ${label} (${url})`);
    console.log(`   feeWei: ${fee} (${t1}ms)`);
    console.log(`   getUser joined: ${user[6]}, activeLp: ${user[0]} (${t2}ms)`);
    console.log(`   protocol: paused=${paused}, weight=${weight}, supply=${supply}, cooldown=${cooldown} (${t3}ms)`);
    console.log(`   TOTAL: ${Date.now() - start}ms`);
    return { url, success: true, time: Date.now() - start };
  } catch (err) {
    console.log(`❌ ${label} (${url})`);
    console.log(`   ERROR: ${err.message?.slice(0, 120)}`);
    console.log(`   TIME: ${Date.now() - start}ms`);
    return { url, success: false, time: Date.now() - start, error: err.message?.slice(0, 120) };
  }
}

console.log("=== Testing BSC Testnet RPCs against CyberMine contract ===\n");
console.log(`Contract: ${STAKING}`);
console.log(`Test address: ${TEST_ADDR}\n`);

const results = [];
for (let i = 0; i < RPCS.length; i++) {
  const r = await testRpc(RPCS[i], `RPC ${i + 1}`);
  results.push(r);
  console.log("");
}

console.log("\n=== SUMMARY ===");
const working = results.filter(r => r.success);
const failed = results.filter(r => !r.success);
console.log(`Working: ${working.length}/${results.length}`);
if (working.length > 0) {
  const fastest = working.sort((a, b) => a.time - b.time)[0];
  console.log(`Fastest: ${fastest.url} (${fastest.time}ms)`);
}
if (failed.length > 0) {
  console.log(`Failed RPCs:`);
  failed.forEach(f => console.log(`  - ${f.url}: ${f.error}`));
}
