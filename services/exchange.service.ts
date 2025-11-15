import apiClient from './apiClient';

export interface IExchangePayload {
    fromCurrency: string;
    toCurrency: string;
    amount: number;
}

export interface IExchangeResult {
    message: string;
    fromAmount: string;
    fromCurrency: string;
    toAmount: string;
    toCurrency: string;
    rateUsed: string;
}

/**
 * Endpoint wymiany walut.
 */
export const performExchange = async (payload: IExchangePayload): Promise<IExchangeResult> => {
    try {
        const response = await apiClient.post('/exchange', payload);
        return response.data;
    } catch (error: any) {
        console.error('Błąd podczas wykonywania wymiany:', error);
        throw new Error(error.response?.data?.message || 'Wystąpił błąd podczas wymiany.');
    }
};