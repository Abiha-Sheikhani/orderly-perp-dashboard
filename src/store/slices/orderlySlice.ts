import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type OnboardingStatus =
  | "disconnected"
  | "checking"
  | "needs_registration"
  | "registering"
  | "needs_key"
  | "adding_key"
  | "ready"
  | "error";

export interface OrderlyState {
  status: OnboardingStatus;
  accountId: string | null;
  orderlyKeyPublic: string | null;
  keyScope: string | null;
  keyExpiration: number | null;
  error: string | null;
}

const initialState: OrderlyState = {
  status: "disconnected",
  accountId: null,
  orderlyKeyPublic: null,
  keyScope: null,
  keyExpiration: null,
  error: null,
};

const orderlySlice = createSlice({
  name: "orderly",
  initialState,
  reducers: {
    setStatus(state, action: PayloadAction<OnboardingStatus>) {
      state.status = action.payload;
      if (action.payload !== "error") state.error = null;
    },
    setAccountId(state, action: PayloadAction<string>) {
      state.accountId = action.payload;
    },
    setKeySession(
      state,
      action: PayloadAction<{ orderlyKeyPublic: string; scope: string; expiration: number }>
    ) {
      state.orderlyKeyPublic = action.payload.orderlyKeyPublic;
      state.keyScope = action.payload.scope;
      state.keyExpiration = action.payload.expiration;
    },
    setError(state, action: PayloadAction<string>) {
      state.status = "error";
      state.error = action.payload;
    },
    reset() {
      return initialState;
    },
  },
});

export const { setStatus, setAccountId, setKeySession, setError, reset } = orderlySlice.actions;
export default orderlySlice.reducer;
