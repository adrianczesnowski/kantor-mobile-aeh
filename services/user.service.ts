import apiClient from './apiClient';

interface ChangeLanguageData {
    language: 'pl' | 'en';
}

interface ChangeLanguageResponse {
    message: string;
    language: 'pl' | 'en';
}

export const changeLanguage = async (data: ChangeLanguageData): Promise<ChangeLanguageResponse> => {
    const response = await apiClient.put('/users/language', data);

    return response.data;
};
