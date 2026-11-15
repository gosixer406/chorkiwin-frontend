import { configureStore } from "@reduxjs/toolkit";
import Auth from './auth'

export const Store = configureStore({
    reducer: {
        auth: Auth,
    }
})