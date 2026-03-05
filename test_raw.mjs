import { JsonRpcProvider, Contract, Interface } from "ethers";

const STAKING = "0xBa75A1CDAD9E5fF1218561f039b80D465A37723e";
const USER = "0x696Ce7c0A98Dc122CF3740E0E2e554E08cbC9187";

// Try calling getUser with a raw eth_call to see the raw return data
const provider = new JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/", 97);

// Method 1: Raw eth_call to see the hex response
const iface = new Interface([
  "function getUser(address user) view returns (uint256, uint256, uint256, address, uint256, uint256, bool)"
]);

const calldata = iface.encodeFunctionData("getUser", [USER]);
console.log("Calldata:", calldata);
console.log("Function selector:", calldata.slice(0, 10));

const rawResult = await provider.call({
  to: STAKING,
  data: calldata,
});

console.log("\nRaw hex response:");
console.log(rawResult);

// Parse the raw hex into 32-byte words
const data = rawResult.slice(2); // remove 0x
const words = [];
for (let i = 0; i < data.length; i += 64) {
  words.push(data.slice(i, i + 64));
}
console.log("\n32-byte words:");
words.forEach((w, i) => {
  const num = BigInt("0x" + w);
  console.log(`  [${i}] 0x${w} = ${num}`);
});

// Now try with DIFFERENT ABI definitions to see which one matches BSCScan
console.log("\n\n=== Trying different ABI field orders ===\n");

// ABI version 1: Our current ABI (7 fields)
const abi1 = new Interface([
  "function getUser(address user) view returns (uint256 activeLp, uint256 pendingLp, uint256 lastClaimTs, address referrer, uint256 referralWeightCreditFp, uint256 referralCount, bool joined)"
]);
try {
  const decoded1 = abi1.decodeFunctionResult("getUser", rawResult);
  console.log("ABI v1 (our current):");
  console.log("  activeLp:", decoded1[0].toString());
  console.log("  pendingLp:", decoded1[1].toString());
  console.log("  lastClaimTs:", decoded1[2].toString());
  console.log("  referrer:", decoded1[3]);
  console.log("  referralWeightCreditFp:", decoded1[4].toString());
  console.log("  referralCount:", decoded1[5].toString());
  console.log("  joined:", decoded1[6]);
} catch (e) {
  console.log("ABI v1 failed:", e.message?.slice(0, 200));
}

// ABI version 2: Maybe there are MORE fields we're missing?
// Let's check if the contract returns more than 7 fields
console.log("\nTotal 32-byte words returned:", words.length);
console.log("Expected for 7 fields (with address packed): 7 words");

// If there are 8+ words, we're missing a field!
if (words.length > 7) {
  console.log("\n⚠️  MORE FIELDS THAN EXPECTED! Contract returns", words.length, "words");
  
  // Try with 8 fields - maybe there's an extra field before 'joined'
  const abi2 = new Interface([
    "function getUser(address user) view returns (uint256, uint256, uint256, address, uint256, uint256, uint256, bool)"
  ]);
  try {
    const decoded2 = abi2.decodeFunctionResult("getUser", rawResult);
    console.log("\nABI v2 (8 fields - extra uint256 before bool):");
    for (let i = 0; i < decoded2.length; i++) {
      console.log(`  [${i}]:`, decoded2[i].toString());
    }
  } catch (e) {
    console.log("ABI v2 failed:", e.message?.slice(0, 200));
  }
  
  // Try with 9 fields
  const abi3 = new Interface([
    "function getUser(address user) view returns (uint256, uint256, uint256, address, uint256, uint256, uint256, uint256, bool)"
  ]);
  try {
    const decoded3 = abi3.decodeFunctionResult("getUser", rawResult);
    console.log("\nABI v3 (9 fields):");
    for (let i = 0; i < decoded3.length; i++) {
      console.log(`  [${i}]:`, decoded3[i].toString());
    }
  } catch (e) {
    console.log("ABI v3 failed:", e.message?.slice(0, 200));
  }
}
