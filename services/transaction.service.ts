import apiClient from './apiClient';

export type TransactionType = 'topup' | 'exchange' | 'withdraw';

export interface ITransaction {
    _id: string;
    userId: string;
    type: TransactionType;
    fromCurrency?: string;
    toCurrency?: string;
    fromAmount?: string;
    toAmount?: string;
    rateUsed?: string;
    timestamp: string;
}

/**
 * Pobiera historię transakcji z paginacją.
 * @param limit Liczba transakcji do pobrania.
 * @param skip Liczba transakcji do pominięcia (offset).
 */
export const fetchTransactions = async (limit: number, skip: number): Promise<ITransaction[]> => {
    const response = await apiClient.get(`/transactions?limit=${limit}&skip=${skip}`);
    return response.data;
};

/**
 * Pobiera szczegóły pojedynczej transakcji.
 * @param transactionId - ID transakcji.
 */
export const fetchTransactionDetails = async (transactionId: string): Promise<ITransaction> => {
    const response = await apiClient.get(`/transactions/${transactionId}`);
    return response.data;
};