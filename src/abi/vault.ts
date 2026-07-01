/**
 * Minimal ABI for Orderly's Vault contract (Asset Layer), covering only what
 * this app needs: quoting/paying the cross-chain messaging fee and depositing
 * collateral. Reconstructed from Orderly's public contract-evm repo and the
 * `AccountDepositTo` / `AccountWithdraw` event signatures (verified against
 * the Arbitrum Vault on a block explorer). Full ABI:
 * https://github.com/OrderlyNetwork/contract-evm-abi
 */
export const vaultAbi = [
  {
    type: "function",
    name: "deposit",
    stateMutability: "payable",
    inputs: [
      {
        name: "data",
        type: "tuple",
        components: [
          { name: "accountId", type: "bytes32" },
          { name: "brokerHash", type: "bytes32" },
          { name: "tokenHash", type: "bytes32" },
          { name: "tokenAmount", type: "uint128" },
        ],
      },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "getDepositFee",
    stateMutability: "view",
    inputs: [
      { name: "sender", type: "address" },
      {
        name: "data",
        type: "tuple",
        components: [
          { name: "accountId", type: "bytes32" },
          { name: "brokerHash", type: "bytes32" },
          { name: "tokenHash", type: "bytes32" },
          { name: "tokenAmount", type: "uint128" },
        ],
      },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "getAllowedToken",
    stateMutability: "view",
    inputs: [{ name: "_tokenHash", type: "bytes32" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "event",
    name: "AccountDepositTo",
    inputs: [
      { name: "accountId", type: "bytes32", indexed: true },
      { name: "userAddress", type: "address", indexed: true },
      { name: "depositNonce", type: "uint64", indexed: true },
      { name: "tokenHash", type: "bytes32", indexed: false },
      { name: "tokenAmount", type: "uint128", indexed: false },
    ],
  },
  {
    type: "event",
    name: "AccountWithdraw",
    inputs: [
      { name: "accountId", type: "bytes32", indexed: true },
      { name: "withdrawNonce", type: "uint64", indexed: true },
      { name: "brokerHash", type: "bytes32", indexed: false },
      { name: "sender", type: "address", indexed: false },
      { name: "receiver", type: "address", indexed: false },
      { name: "tokenHash", type: "bytes32", indexed: false },
      { name: "tokenAmount", type: "uint128", indexed: false },
      { name: "fee", type: "uint128", indexed: false },
    ],
  },
] as const;
