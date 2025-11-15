import axios from 'axios';

interface RateData {
    no: string;
    effectiveDate: string;
    mid: number;
}

interface NbpRateResponse {
    table: string;
    currency: string;
    code: string;
    rates: RateData[];
}

const NBP_API_URL = 'https://api.nbp.pl/api/exchangerates/rates';

const simulateBidAskFromMid = (mid: number) => {
    const SPREAD_MARGIN = 0.02;
    return {
        bid: parseFloat((mid * (1 - SPREAD_MARGIN)).toFixed(4)),
        ask: parseFloat((mid * (1 + SPREAD_MARGIN)).toFixed(4))
    };
};

/**
 * Pobiera kursy dla danej waluty z priorytetem Tabela A -> Tabela B.
 */
export const getCurrencyRates = async (currencyCode: string): Promise<{ bid: number, ask: number }> => {
    const code = currencyCode.toLowerCase();

    const fetchFromTable = async (table: 'a' | 'b') => {
        const response = await axios.get<NbpRateResponse>(`${NBP_API_URL}/${table}/${code}/?format=json`);

        const rate = response.data.rates[0];
        if (!rate || typeof rate.mid !== 'number') {
            throw new Error(`Brak danych 'mid' dla ${currencyCode} w tabeli ${table}`);
        }
        return rate.mid;
    };

    try {
        const mid = await fetchFromTable('a');
        return simulateBidAskFromMid(mid);
    } catch (error: any) {
        if (!axios.isAxiosError(error) || error.response?.status !== 404) {
            console.error(`Błąd API NBP (Tabela A, Frontend) dla ${code}:`, error.message);
            throw new Error('Błąd pobierania kursu NBP (A).');
        }
    }

    try {
        const mid = await fetchFromTable('b');
        return simulateBidAskFromMid(mid);
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            throw new Error(`Nie znaleziono danych dla waluty ${currencyCode} w tabelach A i B.`);
        }
        throw new Error('Błąd pobierania kursu NBP (B).');
    }
};