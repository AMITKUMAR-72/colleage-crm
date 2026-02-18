import api from './api';
import { UserDTO } from '@/types/api';

export interface AuthResponse {
    token: string;
    email: string;
    role?: {
        id: number;
        role: string;
    };
    user?: UserDTO;
}

export interface SignupResponse {
    token: string;
    email: string;
    userId?: number;
    name?: string;
    role?: {
        role: string;
    };
}

export interface LoginRequest {
    email: string;
    password?: string;
}

export interface SignupRequest {
    email: string;
    name: string;
    password?: string;
}

export const AuthService = {
    login: async (request: LoginRequest): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/login', request);
        return response.data;
    },

    signup: async (request: SignupRequest): Promise<SignupResponse> => {
        const response = await api.post<SignupResponse>('/auth/signup', request);
        return response.data;
    },

    affiliateLogin: async (email: string, password?: string, companyName?: string): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/affiliate/login', {
            email,
            password,
            affiliate: { companyName }
        });
        return response.data;
    }
};
