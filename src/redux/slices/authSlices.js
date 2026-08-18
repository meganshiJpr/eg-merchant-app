import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  token: null,
  merchant: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    login: (state, action) => {
      state.token = action.payload.token;
      state.merchant = action.payload.merchant;
      state.isAuthenticated = true;
    },

    logout: (state) => {
      state.token = null;
      state.merchant = null;
      state.isAuthenticated = false;
    },
  },
});

export const { login, logout } = authSlice.actions;

export default authSlice.reducer;