import { useCallback, useEffect, useState } from "react";
import { useAccount, useSignTypedData } from "wagmi";
import { ORDERLY_BROKER_ID } from "@/config/orderly";
import { buildRegistrationTypedData, buildAddOrderlyKeyTypedData } from "@/lib/orderly/eip712";
import { computeAccountId } from "@/lib/orderly/identifiers";
import { generateOrderlyKeyPair } from "@/lib/orderly/crypto";
import { loadOrderlyKey, saveOrderlyKey, clearOrderlyKey } from "@/lib/orderly/keystore";
import { getAccount, getRegistrationNonce, registerAccount, addOrderlyKey, OrderlyApiError } from "@/lib/orderly/api";
import { useOrderlySession } from "@/providers/OrderlySessionContext";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setStatus, setAccountId, setKeySession, setError, reset } from "@/store/slices/orderlySlice";
import { pushActivity } from "@/store/slices/activitySlice";

const KEY_SCOPE = "read,trading";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function useOrderlyOnboarding() {
  const { address, chainId, isConnected } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  const { session, setSession } = useOrderlySession();
  const dispatch = useAppDispatch();
  const status = useAppSelector((s) => s.orderly.status);
  const accountId = useAppSelector((s) => s.orderly.accountId);
  const [isOnboarding, setIsOnboarding] = useState(false);

  // Re-hydrate / re-evaluate whenever the connected wallet or chain changes.
  useEffect(() => {
    let cancelled = false;

    async function evaluate() {
      if (!isConnected || !address || !chainId) {
        dispatch(reset());
        setSession(null);
        return;
      }

      dispatch(setStatus("checking"));

      const cached = loadOrderlyKey(address, ORDERLY_BROKER_ID, chainId);
      if (cached) {
        if (cancelled) return;
        setSession({
          keyPair: cached.keyPair,
          accountId: cached.accountId,
          scope: cached.scope,
          expiration: cached.expiration,
        });
        dispatch(setAccountId(cached.accountId));
        dispatch(
          setKeySession({
            orderlyKeyPublic: cached.keyPair.orderlyKey,
            scope: cached.scope,
            expiration: cached.expiration,
          })
        );
        dispatch(setStatus("ready"));
        return;
      }

      try {
        const account = await getAccount(address, ORDERLY_BROKER_ID);
        if (cancelled) return;
        if (account) {
          dispatch(setAccountId(account.account_id));
          dispatch(setStatus("needs_key"));
        } else {
          dispatch(setStatus("needs_registration"));
        }
      } catch (err) {
        if (cancelled) return;
        // If the lookup endpoint itself is unreachable, fall back to letting
        // the user attempt registration — register_account is idempotent
        // server-side for an already-registered wallet in Orderly's API.
        dispatch(setStatus("needs_registration"));
        // eslint-disable-next-line no-console
        console.warn("[orderly] get_account lookup failed, defaulting to registration flow", err);
      }
    }

    evaluate();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, chainId, isConnected]);

  const startOnboarding = useCallback(async () => {
    if (!address || !chainId) return;
    setIsOnboarding(true);
    try {
      let resolvedAccountId = accountId;

      // Step 1 — register the account on Orderly (skipped if it already exists).
      if (status === "needs_registration") {
        dispatch(setStatus("registering"));
        const { registration_nonce } = await getRegistrationNonce();
        const timestamp = Date.now();
        const typedData = buildRegistrationTypedData({
          brokerId: ORDERLY_BROKER_ID,
          chainId,
          timestamp,
          registrationNonce: Number(registration_nonce),
        });

        const signature = await signTypedDataAsync(typedData);

        try {
          const res = await registerAccount({ message: typedData.message, signature, userAddress: address });
          resolvedAccountId = res.account_id;
        } catch (err) {
          // Fallback: derive deterministically if the API call fails but the
          // signature was valid (e.g. transient network error) — Orderly's
          // account_id is a pure function of (address, brokerId).
          if (err instanceof OrderlyApiError) resolvedAccountId = computeAccountId(address, ORDERLY_BROKER_ID);
          else throw err;
        }

        dispatch(setAccountId(resolvedAccountId!));
        dispatch(
          pushActivity({
            kind: "onboarding",
            status: "success",
            title: "Orderly account registered",
            detail: resolvedAccountId ?? undefined,
          })
        );
        dispatch(setStatus("needs_key"));
      }

      // Step 2 — delegate a fresh ed25519 Orderly Key for this device/session.
      dispatch(setStatus("adding_key"));
      const keyPair = generateOrderlyKeyPair();
      const timestamp = Date.now();
      const expiration = Math.floor(timestamp / 1000) + ONE_YEAR_SECONDS;

      const typedData = buildAddOrderlyKeyTypedData({
        brokerId: ORDERLY_BROKER_ID,
        chainId,
        orderlyKey: keyPair.orderlyKey,
        scope: KEY_SCOPE,
        timestamp,
        expiration,
      });

      const signature = await signTypedDataAsync(typedData);
      await addOrderlyKey({ message: typedData.message, signature, userAddress: address });

      const finalAccountId = resolvedAccountId ?? computeAccountId(address, ORDERLY_BROKER_ID);
      saveOrderlyKey(address, ORDERLY_BROKER_ID, chainId, keyPair, finalAccountId, expiration, KEY_SCOPE);
      setSession({ keyPair, accountId: finalAccountId, scope: KEY_SCOPE, expiration });
      dispatch(setAccountId(finalAccountId));
      dispatch(setKeySession({ orderlyKeyPublic: keyPair.orderlyKey, scope: KEY_SCOPE, expiration }));
      dispatch(setStatus("ready"));
      dispatch(
        pushActivity({
          kind: "onboarding",
          status: "success",
          title: "Trading key delegated",
          detail: keyPair.orderlyKey,
        })
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Onboarding failed";
      dispatch(setError(message));
      dispatch(pushActivity({ kind: "onboarding", status: "error", title: "Onboarding failed", detail: message }));
    } finally {
      setIsOnboarding(false);
    }
  }, [address, chainId, status, accountId, signTypedDataAsync, dispatch, setSession]);

  const signOut = useCallback(() => {
    if (address && chainId) clearOrderlyKey(address, ORDERLY_BROKER_ID, chainId);
    setSession(null);
    dispatch(reset());
  }, [address, chainId, dispatch, setSession]);

  return { status, accountId, session, isOnboarding, startOnboarding, signOut };
}
