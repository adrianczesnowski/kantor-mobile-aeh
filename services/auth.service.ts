import apiClient from './apiClient';

interface AuthData {
    email: string;
    password: string;
}

interface LoginResponse {
    token: string;
    user: {
        _id: string;
        email: string;
        language: string;
    };
}

export const loginUser = async (data: AuthData): Promise<LoginResponse> => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
};
