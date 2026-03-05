/*
 * CyberMine Staking Contract ABI — CybermineStakingV7_Testnet
 * Deployed at 0xBa75A1CDAD9E5fF1218561f039b80D465A37723e (BSC Testnet)
 *
 * IMPORTANT: This ABI must match the verified contract exactly.
 * Field types (uint64, uint32, etc.) affect ABI encoding byte boundaries.
 */

export const STAKING_ABI = [
  // ─── Owner / admin reads ────────────────────────────────────────
  {"type":"function","name":"owner","stateMutability":"view","inputs":[],"outputs":[{"name":"","type":"address"}]},

  // ─── Token addresses ────────────────────────────────────────────
  {"type":"function","name":"mine","stateMutability":"view","inputs":[],"outputs":[{"name":"","type":"address"}]},
  {"type":"function","name":"lpToken","stateMutability":"view","inputs":[],"outputs":[{"name":"","type":"address"}]},
  {"type":"function","name":"devWallet","stateMutability":"view","inputs":[],"outputs":[{"name":"","type":"address"}]},

  // ─── Protocol parameters ────────────────────────────────────────
  {"type":"function","name":"FP","stateMutability":"view","inputs":[],"outputs":[{"name":"","type":"uint256"}]},
  {"type":"function","name":"rFp","stateMutability":"view","inputs":[],"outputs":[{"name":"","type":"uint256"}]},
  {"type":"function","name":"cooldownSeconds","stateMutability":"view","inputs":[],"outputs":[{"name":"","type":"uint256"}]},
  {"type":"function","name":"feeWei","stateMutability":"view","inputs":[],"outputs":[{"name":"","type":"uint256"}]},
  {"type":"function","name":"bannedRescueToken","stateMutability":"view","inputs":[],"outputs":[{"name":"","type":"address"}]},
  {"type":"function","name":"remainingSupply","stateMutability":"view","inputs":[],"outputs":[{"name":"","type":"uint256"}]},
  {"type":"function","name":"totalBaseWeightFp","stateMutability":"view","inputs":[],"outputs":[{"name":"","type":"uint256"}]},
  {"type":"function","name":"paused","stateMutability":"view","inputs":[],"outputs":[{"name":"","type":"bool"}]},

  // ─── User write functions ───────────────────────────────────────
  {"type":"function","name":"joinAndDeposit","stateMutability":"payable","inputs":[{"name":"amount","type":"uint256"}],"outputs":[]},
  {"type":"function","name":"joinAndDepositWithReferrer","stateMutability":"payable","inputs":[{"name":"amount","type":"uint256"},{"name":"referrer","type":"address"}],"outputs":[]},
  {"type":"function","name":"depositPending","stateMutability":"nonpayable","inputs":[{"name":"amount","type":"uint256"}],"outputs":[]},
  {"type":"function","name":"withdraw","stateMutability":"nonpayable","inputs":[{"name":"amount","type":"uint256"}],"outputs":[]},
  {"type":"function","name":"claim","stateMutability":"payable","inputs":[],"outputs":[]},
  {"type":"function","name":"emergencyWithdrawPending","stateMutability":"nonpayable","inputs":[{"name":"amount","type":"uint256"}],"outputs":[]},

  // ─── User read functions ────────────────────────────────────────
  // CRITICAL: field types must match the contract exactly (uint64, uint32, etc.)
  // Wrong types cause ABI decoding to read from wrong byte offsets.
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
  {"type":"function","name":"tierMultiplierFp","stateMutability":"pure","inputs":[{"name":"depositTs","type":"uint64"},{"name":"nowTs","type":"uint64"}],"outputs":[{"name":"","type":"uint256"}]},

  // ─── Events ─────────────────────────────────────────────────────
  {"type":"event","name":"Joined","inputs":[{"indexed":true,"name":"user","type":"address"},{"indexed":true,"name":"referrer","type":"address"}],"anonymous":false},
  {"type":"event","name":"DepositActive","inputs":[{"indexed":true,"name":"user","type":"address"},{"indexed":false,"name":"amount","type":"uint256"},{"indexed":false,"name":"activeDepositTs","type":"uint64"},{"indexed":false,"name":"newCachedBaseWeightFp","type":"uint256"}],"anonymous":false},
  {"type":"event","name":"DepositPending","inputs":[{"indexed":true,"name":"user","type":"address"},{"indexed":false,"name":"amount","type":"uint256"},{"indexed":false,"name":"pendingDepositTs","type":"uint64"},{"indexed":false,"name":"pendingLpAfter","type":"uint256"}],"anonymous":false},
  {"type":"event","name":"WithdrawActive","inputs":[{"indexed":true,"name":"user","type":"address"},{"indexed":false,"name":"amount","type":"uint256"},{"indexed":false,"name":"activeLpAfter","type":"uint256"},{"indexed":false,"name":"cachedBaseWeightFpAfter","type":"uint256"}],"anonymous":false},
  {"type":"event","name":"Claimed","inputs":[
    {"indexed":true,"name":"user","type":"address"},
    {"indexed":false,"name":"reward","type":"uint256"},
    {"indexed":false,"name":"baseWeightFp","type":"uint256"},
    {"indexed":false,"name":"referralBonusUsedFp","type":"uint256"},
    {"indexed":false,"name":"totalBaseWeightFp","type":"uint256"},
    {"indexed":false,"name":"remainingSupply","type":"uint256"}
  ],"anonymous":false},
  {"type":"event","name":"ReferralCredited","inputs":[{"indexed":true,"name":"referrer","type":"address"},{"indexed":true,"name":"referee","type":"address"},{"indexed":false,"name":"creditFp","type":"uint256"}],"anonymous":false},
  {"type":"event","name":"Rollover","inputs":[{"indexed":true,"name":"user","type":"address"},{"indexed":false,"name":"rolledPendingAmount","type":"uint256"},{"indexed":false,"name":"newActiveLp","type":"uint256"},{"indexed":false,"name":"newActiveDepositTs","type":"uint64"},{"indexed":false,"name":"newCachedBaseWeightFp","type":"uint256"}],"anonymous":false},
  {"type":"event","name":"EmergencyWithdrawPending","inputs":[{"indexed":true,"name":"user","type":"address"},{"indexed":false,"name":"amount","type":"uint256"},{"indexed":false,"name":"pendingLpAfter","type":"uint256"}],"anonymous":false},
  {"type":"event","name":"Paused","inputs":[{"indexed":false,"name":"paused","type":"bool"}],"anonymous":false},

  {"type":"receive","stateMutability":"payable"},
] as const;
