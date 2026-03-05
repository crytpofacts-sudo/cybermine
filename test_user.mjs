import { JsonRpcProvider, Contract } from "ethers";

const STAKING = "0xBa75A1CDAD9E5fF1218561f039b80D465A37723e";
const USER = "0x696Ce7c0A98Dc122CF3740E0E2e554E08cbC9187";

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
    inputs: [{ name: "user", type: "address" }],
    name: "nextClaimTime",
    outputs: [{ name: "", type: "uint256" }],
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

const LP_TOKEN = "0xc742d03dc150956940f4ffDFA477f36926a2dBc4";
const MINE_TOKEN = "0x40325c4F37F577111faFC4f31AB7979026626680";
const ERC20_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
];

const RPCS = [
  "https://data-seed-prebsc-1-s1.binance.org:8545/",
  "https://bsc-testnet-rpc.publicnode.com",
];

for (const rpc of RPCS) {
  console.log(`\n=== Testing with ${rpc} ===`);
  try {
    const provider = new JsonRpcProvider(rpc, 97);
    const staking = new Contract(STAKING, ABI, provider);
    const lp = new Contract(LP_TOKEN, ERC20_ABI, provider);
    const mine = new Contract(MINE_TOKEN, ERC20_ABI, provider);

    console.log(`\nUser: ${USER}`);
    
    // getUser
    const user = await staking.getUser(USER);
    console.log(`\ngetUser() response (raw):`);
    console.log(`  [0] activeLp:               ${user[0]}`);
    console.log(`  [1] pendingLp:              ${user[1]}`);
    console.log(`  [2] lastClaimTs:            ${user[2]}`);
    console.log(`  [3] referrer:               ${user[3]}`);
    console.log(`  [4] referralWeightCreditFp: ${user[4]}`);
    console.log(`  [5] referralCount:          ${user[5]}`);
    console.log(`  [6] joined:                 ${user[6]}`);
    console.log(`  typeof user[6]:             ${typeof user[6]}`);
    console.log(`  Boolean(user[6]):           ${Boolean(user[6])}`);
    
    // nextClaimTime
    const nct = await staking.nextClaimTime(USER);
    console.log(`\nnextClaimTime: ${nct}`);
    
    // Token balances
    const lpBal = await lp.balanceOf(USER);
    const lpAllow = await lp.allowance(USER, STAKING);
    const mineBal = await mine.balanceOf(USER);
    const lpDec = await lp.decimals();
    const mineDec = await mine.decimals();
    
    console.log(`\nLP balance:    ${lpBal} (decimals: ${lpDec})`);
    console.log(`LP allowance:  ${lpAllow}`);
    console.log(`MINE balance:  ${mineBal} (decimals: ${mineDec})`);
    
    // Protocol data
    const fee = await staking.feeWei();
    const paused = await staking.paused();
    const weight = await staking.totalBaseWeightFp();
    const supply = await staking.remainingSupply();
    const cooldown = await staking.cooldownSeconds();
    
    console.log(`\nProtocol data:`);
    console.log(`  feeWei:           ${fee}`);
    console.log(`  paused:           ${paused}`);
    console.log(`  totalBaseWeightFp: ${weight}`);
    console.log(`  remainingSupply:  ${supply}`);
    console.log(`  cooldownSeconds:  ${cooldown}`);
    
    console.log(`\n✅ All calls succeeded on ${rpc}`);
    break; // Only need one successful test
  } catch (err) {
    console.log(`❌ Failed: ${err.message?.slice(0, 200)}`);
  }
}
