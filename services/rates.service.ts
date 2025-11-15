import apiClient from './apiClient';

export interface IRate {
    currency: string;
    code: string;
    mid: number;
}

export interface IHistoryRate {
    no: string;
    effectiveDate: string;
    mid: number;
}

/**
 * Pobiera najnowszą tabelę kursów walut (tabela A).
 */
export const getLatestRates = async (): Promise<IRate[]> => {
    try {
        const response = await apiClient.get('/rates/latest');
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Nie można pobrać listy kursów.');
    }
};

/**
 * Pobiera historię kursów dla wybranej waluty.
 * Domyślnie pobiera 30 ostatnich dni (zgodnie z logiką backendu).
 */
export const getCurrencyHistory = async (currencyCode: string): Promise<IHistoryRate[]> => {
    try {
        const response = await apiClient.get(`/rates/${currencyCode}/history`);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Nie można pobrać historii kursu.');
    }
};