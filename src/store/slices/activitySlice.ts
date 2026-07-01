import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ActivityKind = "onboarding" | "deposit" | "withdraw";
export type ActivityStatus = "pending" | "success" | "error";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  status: ActivityStatus;
  title: string;
  detail?: string;
  txHash?: `0x${string}`;
  explorerUrl?: string;
  timestamp: number;
}

interface ActivityState {
  items: ActivityItem[];
}

const initialState: ActivityState = { items: [] };

const activitySlice = createSlice({
  name: "activity",
  initialState,
  reducers: {
    pushActivity: {
      reducer(state, action: PayloadAction<ActivityItem>) {
        state.items.unshift(action.payload);
        if (state.items.length > 50) state.items.pop();
      },
      prepare(item: Omit<ActivityItem, "id" | "timestamp">) {
        return {
          payload: {
            ...item,
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            timestamp: Date.now(),
          },
        };
      },
    },
    updateActivity(state, action: PayloadAction<{ id: string; changes: Partial<ActivityItem> }>) {
      const item = state.items.find((i) => i.id === action.payload.id);
      if (item) Object.assign(item, action.payload.changes);
    },
    clearActivity(state) {
      state.items = [];
    },
  },
});

export const { pushActivity, updateActivity, clearActivity } = activitySlice.actions;
export default activitySlice.reducer;
