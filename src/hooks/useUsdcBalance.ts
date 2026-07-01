import { useAccount, useBalance } from "wagmi";
import { getContracts } from "@/config/contracts";
import { isSupportedChainId } from "@/config/chains";

export function useUsdcBalance() {
  const { address, chainId } = useAccount();
  const supported = isSupportedChainId(chainId);
  const usdc = supported ? getContracts(chainId).usdc : undefined;

  const query = useBalance({
    address,
    token: usdc,
    query: { enabled: Boolean(address && usdc), refetchInterval: 15_000 },
  });

  return query;
}
