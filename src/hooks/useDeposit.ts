import { useCallback, useState } from "react";
import { useAccount, useConfig } from "wagmi";
import { readContract, writeContract, waitForTransactionReceipt } from "wagmi/actions";
import { erc20Abi } from "@/abi/erc20";
import { vaultAbi } from "@/abi/vault";
import { getContracts } from "@/config/contracts";
import { ORDERLY_BROKER_ID, ORDERLY_TOKEN_SYMBOL } from "@/config/orderly";
import { computeAccountId, getBrokerHash, getTokenHash } from "@/lib/orderly/identifiers";
import { isSupportedChainId } from "@/config/chains";
import { useAppDispatch } from "@/store/hooks";
import { pushActivity, updateActivity } from "@/store/slices/activitySlice";
import type { Address } from "viem";

export type DepositStep =
  | "idle"
  | "approving"
  | "confirming_approval"
  | "depositing"
  | "confirming_deposit"
  | "done"
  | "error";

export function useDeposit() {
  const { address, chainId } = useAccount();
  const config = useConfig();
  const dispatch = useAppDispatch();
  const [step, setStep] = useState<DepositStep>("idle");
  const [error, setErrorState] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<Address | undefined>();

  const checkAllowance = useCallback(
    async (amount: bigint): Promise<boolean> => {
      if (!address || !isSupportedChainId(chainId)) return false;
      const { usdc, vault } = getContracts(chainId);
      const allowance = await readContract(config, {
        abi: erc20Abi,
        address: usdc,
        functionName: "allowance",
        args: [address, vault],
      });
      return allowance >= amount;
    },
    [address, chainId, config]
  );

  const deposit = useCallback(
    async (amount: bigint) => {
      if (!address || !isSupportedChainId(chainId)) {
        setErrorState("Connect a wallet on a supported testnet first.");
        setStep("error");
        return;
      }

      setErrorState(null);
      setStep("idle");
      const { usdc, vault, usdcDecimals } = getContracts(chainId);
      const accountId = computeAccountId(address, ORDERLY_BROKER_ID);
      const brokerHash = getBrokerHash(ORDERLY_BROKER_ID);
      const tokenHash = getTokenHash(ORDERLY_TOKEN_SYMBOL);
      const depositData = { accountId, brokerHash, tokenHash, tokenAmount: amount };

      const activityAction = pushActivity({
        kind: "deposit",
        status: "pending",
        title: `Depositing ${(Number(amount) / 10 ** usdcDecimals).toLocaleString()} USDC`,
      });
      dispatch(activityAction);
      const activityId = activityAction.payload.id;

      try {
        const hasAllowance = await checkAllowance(amount);
        if (!hasAllowance) {
          setStep("approving");
          const approveHash = await writeContract(config, {
            abi: erc20Abi,
            address: usdc,
            functionName: "approve",
            args: [vault, amount],
          });
          setStep("confirming_approval");
          await waitForTransactionReceipt(config, { hash: approveHash, chainId });
        }

        setStep("depositing");
        const fee = await readContract(config, {
          abi: vaultAbi,
          address: vault,
          functionName: "getDepositFee",
          args: [address, depositData],
        }).catch(() => 0n); // some testnet deployments have zero/no messaging fee

        const depositHash = await writeContract(config, {
          abi: vaultAbi,
          address: vault,
          functionName: "deposit",
          args: [depositData],
          value: fee,
        });

        setTxHash(depositHash);
        setStep("confirming_deposit");
        await waitForTransactionReceipt(config, { hash: depositHash, chainId });

        setStep("done");
        dispatch(
          updateActivity({
            id: activityId,
            changes: { status: "success", txHash: depositHash, title: "Deposit confirmed on-chain" },
          })
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Deposit failed";
        setErrorState(message);
        setStep("error");
        dispatch(updateActivity({ id: activityId, changes: { status: "error", detail: message } }));
      }
    },
    [address, chainId, config, checkAllowance, dispatch]
  );

  const reset = useCallback(() => {
    setStep("idle");
    setErrorState(null);
    setTxHash(undefined);
  }, []);

  return { step, error, txHash, deposit, reset };
}
