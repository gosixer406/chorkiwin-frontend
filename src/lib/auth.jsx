import { createSlice } from "@reduxjs/toolkit";
import { clearSession, readSession, writeSession } from './api';

const savedSession = readSession();

const Auth = createSlice({
    name: 'auth',
    initialState: {
        isLoggedIn: Boolean(savedSession.accessToken),
        initialized: !savedSession.accessToken,
        user: savedSession.user || null,
        accessToken: savedSession.accessToken || null,
        refreshToken: savedSession.refreshToken || null,
    },
    reducers: {
        toggleLogin(state, action) {
            state.isLoggedIn = action.payload;
        },
        setSession(state, action) {
            const { user, accessToken, refreshToken } = action.payload;
            state.isLoggedIn = true;
            state.initialized = true;
            state.user = user;
            state.accessToken = accessToken;
            state.refreshToken = refreshToken;
            writeSession({ user, accessToken, refreshToken });
        },
        setUser(state, action) {
            const latestSession = readSession();
            state.user = action.payload;
            state.isLoggedIn = true;
            state.initialized = true;
            state.accessToken = latestSession.accessToken || state.accessToken;
            state.refreshToken = latestSession.refreshToken || state.refreshToken;
            writeSession({
                user: action.payload,
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
            });
        },
        setWallet(state, action) {
            if (!state.user) return;
            state.user = {
                ...state.user,
                wallet: {
                    ...(state.user.wallet || {}),
                    ...(action.payload || {}),
                },
            };
            writeSession({
                user: state.user,
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
            });
        },
        finishAuth(state) {
            state.initialized = true;
        },
        logout(state) {
            state.isLoggedIn = false;
            state.initialized = true;
            state.user = null;
            state.accessToken = null;
            state.refreshToken = null;
            clearSession();
        },
    }
})
export const { toggleLogin, setSession, setUser, setWallet, finishAuth, logout } = Auth.actions;
export default Auth.reducer;
