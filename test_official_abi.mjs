import { JsonRpcProvider, Contract } from "ethers";

const STAKING = "0xBa75A1CDAD9E5fF1218561f039b80D465A37723e";
const USERS = [
  "0x696Ce7c0A98Dc122CF3740E0E2e554E08cbC9187",
  "0xEC54BC473B84b62644dFF6bBcE41D491144bae04",
];

// Official ABI from the integration guide — exact types
const ABI = [
  {"type":"function","name":"getUser","stateMutability":"view","inputs":[{"name":"a","type":"address"}],"outputs":[
    {"name":"activeLp","type":"uint256"},
    {"name":"activeDepositTs","type":"uint64"},
    {"name":"pendingLp","type":"uint256"},
    {"name":"pendingDepositTs","type":"uint64"},
    {"name":"lastClaimTs","type":"uint64"},
    {"name":"referrer","type":"address"},
    {"name":"referralWeightCreditFp","type":"uint256"},
    {"name":"cachedBaseWeightFp","type":"uint256"},
    {"name":"totalClaimed","type":"uint256"},
    {"name":"referralCount","type":"uint32"},
    {"name":"joined","type":"bool"}
  ]},
  {"type":"function","name":"nextClaimTime","stateMutability":"view","inputs":[{"name":"a","type":"address"}],"outputs":[{"name":"","type":"uint64"}]},
];

const provider = new JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/", 97);
const staking = new Contract(STAKING, ABI, provider);

for (const user of USERS) {
  console.log(`\n=== ${user} ===`);
  try {
    const u = await staking.getUser(user);
    console.log(`  activeLp:               ${u.activeLp}`);
    console.log(`  activeDepositTs:        ${u.activeDepositTs}`);
    console.log(`  pendingLp:              ${u.pendingLp}`);
    console.log(`  pendingDepositTs:       ${u.pendingDepositTs}`);
    console.log(`  lastClaimTs:            ${u.lastClaimTs}`);
    console.log(`  referrer:               ${u.referrer}`);
    console.log(`  referralWeightCreditFp: ${u.referralWeightCreditFp}`);
    console.log(`  cachedBaseWeightFp:     ${u.cachedBaseWeightFp}`);
    console.log(`  totalClaimed:           ${u.totalClaimed}`);
    console.log(`  referralCount:          ${u.referralCount}`);
    console.log(`  joined:                 ${u.joined}`);
    
    const nct = await staking.nextClaimTime(user);
    console.log(`  nextClaimTime:          ${nct}`);
  } catch (err) {
    console.log(`  ERROR: ${err.message?.slice(0, 200)}`);
  }
}
