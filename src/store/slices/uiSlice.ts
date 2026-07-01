import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface ToastItem {
  id: string;
  variant: "default" | "success" | "error" | "warning";
  title: string;
  description?: string;
}

interface UiState {
  connectDialogOpen: boolean;
  toasts: ToastItem[];
}

const initialState: UiState = {
  connectDialogOpen: false,
  toasts: [],
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setConnectDialogOpen(state, action: PayloadAction<boolean>) {
      state.connectDialogOpen = action.payload;
    },
    pushToast: {
      reducer(state, action: PayloadAction<ToastItem>) {
        state.toasts.push(action.payload);
      },
      prepare(toast: Omit<ToastItem, "id">) {
        return { payload: { ...toast, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` } };
      },
    },
    dismissToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const { setConnectDialogOpen, pushToast, dismissToast } = uiSlice.actions;
export default uiSlice.reducer;
