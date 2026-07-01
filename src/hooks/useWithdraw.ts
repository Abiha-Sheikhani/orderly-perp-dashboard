import { useCallback, useState } from "react";
import { useAccount, useSignTypedData } from "wagmi";
import { ORDERLY_BROKER_ID, ORDERLY_TOKEN_SYMBOL, LEDGER_CONTRACT_TESTNET } from "@/config/orderly";
import { buildWithdrawTypedData } from "@/lib/orderly/eip712";
import { getWithdrawNonce, submitWithdrawRequest, getAssetHistory } from "@/lib/orderly/api";
import type { OrderlyKeyPair } from "@/lib/orderly/crypto";
import { useOrderlySession } from "@/providers/OrderlySessionContext";
import { useAppDispatch } from "@/store/hooks";
import { pushActivity, updateActivity } from "@/store/slices/activitySlice";
import { CHAIN_METADATA, isSupportedChainId } from "@/config/chains";

export type WithdrawStep = "idle" | "signing" | "submitting" | "settling" | "done" | "error";

const POLL_INTERVAL_MS = 4000;
const POLL_TIMEOUT_MS = 3 * 60 * 1000;

export function useWithdraw() {
  const { address, chainId } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  const { session } = useOrderlySession();
  const dispatch = useAppDispatch();
  const [step, setStep] = useState<WithdrawStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const withdraw = useCallback(
    async (amountRaw: string) => {
      if (!address || !chainId || !session) {
        setError("Complete onboarding before withdrawing.");
        setStep("error");
        return;
      }
      if (!isSupportedChainId(chainId)) {
        setError("Switch to a supported testnet first.");
        setStep("error");
        return;
      }

      setError(null);
      setTxHash(undefined);

      const activityAction = pushActivity({
        kind: "withdraw",
        status: "pending",
        title: `Withdrawing ${amountRaw} USDC`,
      });
      dispatch(activityAction);
      const activityId = activityAction.payload.id;

      try {
        setStep("signing");
        const { withdraw_nonce } = await getWithdrawNonce(session.keyPair, session.accountId);
        const timestamp = Date.now();

        const typedData = buildWithdrawTypedData({
          brokerId: ORDERLY_BROKER_ID,
          chainId,
          receiver: address,
          token: ORDERLY_TOKEN_SYMBOL,
          amount: amountRaw,
          withdrawNonce: withdraw_nonce,
          timestamp,
        });

        const signature = await signTypedDataAsync(typedData);

        setStep("submitting");
        const res = await submitWithdrawRequest(session.keyPair, session.accountId, {
          message: typedData.message,
          signature,
          userAddress: address,
          verifyingContract: LEDGER_CONTRACT_TESTNET,
        });

        setStep("settling");
        dispatch(
          updateActivity({
            id: activityId,
            changes: { title: "Withdrawal submitted — awaiting operator settlement", detail: res.withdraw_id },
          })
        );

        // Orderly's operator settles the withdrawal on-chain asynchronously.
        // We poll asset history for the matching row's tx hash rather than
        // submitting an on-chain tx ourselves (the user already authorized
        // it off-chain with their EIP-712 signature above).
        const settledTx = await pollForSettlement(session.keyPair, session.accountId, res.withdraw_id);

        if (settledTx) {
          setTxHash(settledTx);
          const explorer = CHAIN_METADATA[chainId].explorer;
          dispatch(
            updateActivity({
              id: activityId,
              changes: {
                status: "success",
                title: "Withdrawal settled on-chain",
                txHash: settledTx,
                explorerUrl: `${explorer}/tx/${settledTx}`,
              },
            })
          );
        } else {
          dispatch(
            updateActivity({
              id: activityId,
              changes: { title: "Withdrawal accepted — settlement still pending", status: "pending" },
            })
          );
        }

        setStep("done");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Withdrawal failed";
        setError(message);
        setStep("error");
        dispatch(updateActivity({ id: activityId, changes: { status: "error", detail: message } }));
      }
    },
    [address, chainId, session, signTypedDataAsync, dispatch]
  );

  const reset = useCallback(() => {
    setStep("idle");
    setError(null);
    setTxHash(undefined);
  }, []);

  return { step, error, txHash, withdraw, reset };
}

async function pollForSettlement(
  keyPair: OrderlyKeyPair,
  accountId: string,
  withdrawId: string
): Promise<`0x${string}` | undefined> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const { rows } = await getAssetHistory(keyPair, accountId);
      const match = rows.find((r) => r.id === withdrawId && r.side === "WITHDRAW");
      if (match?.status === "COMPLETED" && match.tx_id) {
        return match.tx_id as `0x${string}`;
      }
    } catch {
      // transient — keep polling until timeout
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  return undefined;
}
