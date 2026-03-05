import { JsonRpcProvider, Contract, Interface } from "ethers";

const STAKING = "0xBa75A1CDAD9E5fF1218561f039b80D465A37723e";
const USER = "0x696Ce7c0A98Dc122CF3740E0E2e554E08cbC9187";

const provider = new JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/", 97);

// We know from the raw data:
// [0] = 300000000000000000000 (activeLp - uint256)
// [1] = 1772684380 (looks like a timestamp or pendingLp - uint256)
// [2] = 0 (lastClaimTs - uint256)
// [3] = 0x000...000 (referrer - address, takes full 32 bytes)
// [4] = 1772741011 (looks like a timestamp - uint256)
// [5] = 0 (uint256)
// [6] = 0 (uint256 or bool)
// [7] = 630000000000000000000 (uint256 - looks like a token amount)
// [8] = 2316952101313232824488610 (uint256 - large number)
// [9] = 1 (bool or uint256)
// [10] = 1 (bool - this is joined!)

// The contract struct likely has these fields based on the values:
// activeLp, pendingLp, lastClaimTs, referrer, referralWeightCreditFp, referralCount,
// + some extra fields like: baseWeightFp, totalClaimedMine, hasClaimed, joined

// Let's try the full 11-field ABI
const abi11 = new Interface([
  "function getUser(address user) view returns (uint256 activeLp, uint256 pendingLp, uint256 lastClaimTs, address referrer, uint256 referralWeightCreditFp, uint256 referralCount, uint256 field6, uint256 field7, uint256 field8, bool field9, bool joined)"
]);

const calldata = abi11.encodeFunctionData("getUser", [USER]);
const rawResult = await provider.call({ to: STAKING, data: calldata });
const decoded = abi11.decodeFunctionResult("getUser", rawResult);

console.log("11-field decode:");
const names = ["activeLp", "pendingLp", "lastClaimTs", "referrer", "referralWeightCreditFp", "referralCount", "field6", "field7", "field8", "field9", "joined"];
for (let i = 0; i < decoded.length; i++) {
  console.log(`  [${i}] ${names[i]}: ${decoded[i]}`);
}

// Also check: maybe field9 is "hasClaimed" and field10 is "joined"
// And field6 could be something like "depositCount" or "lastDepositTs"
// field7 looks like a token amount (630 * 10^18)
// field8 looks like a very large number - maybe totalClaimedMine

// Let's also try reading the "users" mapping directly if it exists
// to compare with getUser
console.log("\n\nNow let's also check the function selector from BSCScan:");
console.log("getUser selector: 0x6f77926b");

// Let's also check if there's a "users" public mapping
const usersAbi = new Interface([
  "function users(address) view returns (uint256, uint256, uint256, address, uint256, uint256, uint256, uint256, uint256, bool, bool)"
]);
try {
  const usersCalldata = usersAbi.encodeFunctionData("users", [USER]);
  console.log("\nusers() selector:", usersCalldata.slice(0, 10));
  const usersResult = await provider.call({ to: STAKING, data: usersCalldata });
  if (usersResult && usersResult !== "0x") {
    const usersDecoded = usersAbi.decodeFunctionResult("users", usersResult);
    console.log("users() mapping result:");
    for (let i = 0; i < usersDecoded.length; i++) {
      console.log(`  [${i}]: ${usersDecoded[i]}`);
    }
  }
} catch (e) {
  console.log("users() mapping not available or different signature:", e.message?.slice(0, 100));
}
