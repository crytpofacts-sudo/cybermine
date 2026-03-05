/*
 * CyberMine Staking Contract ABI — CybermineStakingV7_Testnet
 * Deployed at 0xBa75A1CDAD9E5fF1218561f039b80D465A37723e (BSC Testnet)
 * Only includes the functions the UI needs.
 */

export const STAKING_ABI = [
  // ─── Read functions ──────────────────────────────────────────
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
    name: "cooldownSeconds",
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
    name: "mine",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "lpToken",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalBaseWeight",
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

  // ─── Write functions ─────────────────────────────────────────
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "joinAndDeposit",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "referrer", type: "address" },
    ],
    name: "joinAndDepositWithReferrer",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "depositPending",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "claim",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "emergencyWithdrawPending",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
