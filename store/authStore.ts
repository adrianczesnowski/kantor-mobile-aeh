import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface AuthState {
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    setToken: (token: string) => Promise<void>;
    logout: () => Promise<void>;
    initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    isAuthenticated: false,
    isLoading: true,

    setToken: async (token: string) => {
        await SecureStore.setItemAsync('authToken', token);
        set({ token, isAuthenticated: true });
    },

    logout: async () => {
        await SecureStore.deleteItemAsync('authToken');
        set({ token: null, isAuthenticated: false });
    },

    initializeAuth: async () => {
        try {
            const token = await SecureStore.getItemAsync('authToken');
            if (token) {
                set({ token, isAuthenticated: true, isLoading: false });
            } else {
                set({ token: null, isAuthenticated: false, isLoading: false });
            }
        } catch (e) {
            console.error("Błąd inicjalizacji autoryzacji:", e);
            set({ token: null, isAuthenticated: false, isLoading: false });
        }
    },
}));

useAuthStore.getState().initializeAuth();