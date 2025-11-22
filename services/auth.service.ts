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

interface RegisterResponse {
    message: string;
    user: {
        _id: string;
        email: string;
    };
}

interface ChangePasswordData {
    oldPassword: string;
    newPassword: string;
}

export const loginUser = async (data: AuthData): Promise<LoginResponse> => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
};

export const registerUser = async (data: AuthData): Promise<RegisterResponse> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
};

export const changePassword = async (data: ChangePasswordData) => {
    const response = await apiClient.put('/users/password', data);
    return response.data;
};