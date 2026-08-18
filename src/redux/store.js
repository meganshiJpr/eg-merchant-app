import { configureStore } from "@reduxjs/toolkit";

import authReducer from "./slices/authSlice";
import merchantReducer from "./slices/merchantSlice";

import { baseApi } from "./api/baseApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    merchant: merchantReducer,

    [baseApi.reducerPath]: baseApi.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

export default store;