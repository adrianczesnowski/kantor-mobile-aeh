import apiClient from './apiClient';

export interface IWallet {
    currency: string;
    balance: string;
}

export interface ITopUpPayload {
    currency: string;
    amount: number;
}

export interface IWithdrawPayload {
    currency: string;
    amount: number;
}

export const fetchWallets = async (): Promise<IWallet[]> => {
    try {
        const response = await apiClient.get('/wallets');
        return response.data;
    } catch (error) {
        throw new Error('Nie udało się pobrać portfeli.');
    }
};

export const topUpWallet = async (payload: ITopUpPayload) => {
    try {
        const response = await apiClient.post('/wallets/topup', payload);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Nie udało się zasilić konta.');
    }
};

export const withdrawWallet = async (payload: IWithdrawPayload) => {
    try {
        const response = await apiClient.post('/wallets/withdraw', payload);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Nie udało się wypłacić środków.');
    }
};