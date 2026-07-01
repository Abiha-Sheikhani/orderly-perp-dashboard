import { configureStore } from "@reduxjs/toolkit";
import orderlyReducer from "./slices/orderlySlice";
import activityReducer from "./slices/activitySlice";
import uiReducer from "./slices/uiSlice";

export const store = configureStore({
  reducer: {
    orderly: orderlyReducer,
    activity: activityReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
