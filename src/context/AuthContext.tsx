'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserDTO, Role } from '@/types/api';
import { AuthService } from '@/services/authService';
import api from '@/services/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface AuthContextType {
    user: UserDTO | null;
    role: Role | null;
    isLoading: boolean;
    login: (email: string, password?: string) => Promise<void>;
    signup: (name: string, email: string, password?: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserDTO | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const role = user?.role || null;

    useEffect(() => {
        const restoreSession = () => {
            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');
            
            if (token && token !== 'undefined' && storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);
                } catch (e) {
                    console.error("Session restoration failed", e);
                    localStorage.clear();
                }
            }
            setIsLoading(false);
        };

        restoreSession();
    }, []);

    const navigateByRole = (role: Role) => {
        switch (role) {
            case 'ADMIN': router.push('/admin'); break;
            case 'MANAGER': router.push('/manager'); break;
            case 'COUNSELOR': router.push('/counselor'); break;
            case 'AFFILIATE': router.push('/affiliate'); break;
            default: router.push('/login');
        }
    };

    const login = async (email: string, password?: string) => {
        const { token, email: userEmail } = await AuthService.login({ email, password });
        localStorage.setItem('token', token);
        
        let detectedRole: Role = 'USER';
        let userId = Math.floor(Math.random() * 1000);
        let userName = email.split('@')[0];
        
        try {
            // Fetch full user details from the backend to get the correct role
            // This replaces the unreliable guessing logic and the problematic 404 counselor check
            const response = await api.get(`/api/users/email/${userEmail}`);
            const userData = response.data;
            
            if (userData) {
                if (userData.role) {
                    detectedRole = (userData.role.role as Role) || 'USER';
                }
                userId = userData.id || userId;
                userName = userData.name || userName;
            }
        } catch (e) {
            console.error("Failed to fetch user role from backend, using basic USER role", e);
        }

        const newUser: UserDTO = { 
            id: userId, 
            email: userEmail, 
            name: userName,
            role: detectedRole,
            isActive: 'Active' // Default
        };
        
        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
        navigateByRole(detectedRole);
    };

    const signup = async (name: string, email: string, password?: string) => {
        const response = await AuthService.signup({ name, email, password });
        const token = response.token;
        const userEmail = response.email;
        
        localStorage.setItem('token', token);
        
        const newUser: UserDTO = { 
            id: response.userId || Math.floor(Math.random() * 1000), 
            email: userEmail, 
            name: name,
            role: (response.role?.role as Role) || 'USER',
            isActive: 'Active'
        };
        
        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
        
        // Admin or Manager go to dashboard, others might need login or a generic page
        if (newUser.role === 'ADMIN' || newUser.role === 'MANAGER') {
            navigateByRole(newUser.role);
        } else {
            // After signup, redirect to login to ensure full profile sync
            router.push('/login');
            toast.success('Registration successful. Please login.');
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        router.push('/login');
    };


    return (
        <AuthContext.Provider value={{ 
            user, 
            role, 
            isLoading,
            login, 
            signup,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
