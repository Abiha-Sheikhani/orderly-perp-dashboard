import { useCallback } from "react";
import { useAppDispatch } from "@/store/hooks";
import { pushToast, type ToastItem } from "@/store/slices/uiSlice";

export function useToast() {
  const dispatch = useAppDispatch();
  const toast = useCallback(
    (toastInput: Omit<ToastItem, "id">) => {
      dispatch(pushToast(toastInput));
    },
    [dispatch]
  );
  return { toast };
}
