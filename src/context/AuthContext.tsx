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

    const normalizeRole = (roleInput: any): Role => {
        if (!roleInput) return 'USER';

        let r = "";
        if (typeof roleInput === 'string') {
            r = roleInput;
        } else if (roleInput.role) {
            r = roleInput.role;
        } else {
            r = String(roleInput);
        }

        let clean = r.toUpperCase();

        // Handle complex string format like ROLE{ROLE='COUNSELOR'}
        if (clean.includes("ROLE='")) {
            const match = clean.match(/ROLE='([^']+)'/);
            if (match) clean = match[1];
        } else if (clean.includes("{")) {
            // Fallback for other nested brace formats
            const match = clean.match(/=([^,}]+)/) || clean.match(/{([^}]+)}/);
            if (match) clean = match[1].replace(/['"]/g, '');
        }

        // Standard cleanups
        clean = clean.replace('ROLE_', '').trim();

        // Handle typos
        if (clean === 'CONSENLOR' || clean === 'COUSELOR') return 'COUNSELOR';

        return clean as Role;
    };

    const navigateByRole = (role: Role) => {
        if (!role) {
            router.push('/login');
            return;
        }
        console.log("Navigating for role:", role);
        const upperRole = String(role).toUpperCase();
        switch (upperRole) {
            case 'ADMIN': router.push('/admin'); break;
            case 'MANAGER': router.push('/manager'); break;
            case 'COUNSELOR': router.push('/counselor/leads'); break;
            case 'AFFILIATE': router.push('/affiliate'); break;
            case 'MENTOR': router.push('/mentor'); break;
            default: router.push('/login');
        }
    };

    const login = async (email: string, password?: string) => {
        const authData = await AuthService.login({ email, password });
        const { token, email: userEmail } = authData;
        localStorage.setItem('token', token);

        let detectedRole: Role = 'USER';
        let userId = authData.user?.id || Math.floor(Math.random() * 1000);
        let userName = authData.user?.name || email.split('@')[0];

        // 1. Try to get role from auth response
        if (authData.role) {
            detectedRole = normalizeRole(authData.role);
        } else if (authData.user && authData.user.role) {
            detectedRole = normalizeRole(authData.user.role);
        }

        // 2. Try decoding JWT as a reliable secondary source
        if ((detectedRole === 'USER' || !detectedRole) && token) {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const payload = JSON.parse(window.atob(base64));

                // Check common role claim names
                const roleClaim = payload.role || payload.roles || (payload.authorities && payload.authorities[0]);
                if (roleClaim) {
                    detectedRole = normalizeRole(roleClaim);
                }
            } catch (e) {
                console.error("JWT decode failed during login", e);
            }
        }

        // 3. Sync with full user details from the backend
        try {
            // Only perform backend profile sync for managers/admins or if the role wasn't resolved over JWT
            if (detectedRole === 'ADMIN' || detectedRole === 'MANAGER' || detectedRole === 'USER') {
                const response = await api.get(`/api/users/email/${userEmail}`);
                const userData = response.data;

                if (userData) {
                    if (userData.role) {
                        detectedRole = normalizeRole(userData.role);
                    }
                    userId = userData.id || userId;
                    userName = userData.name || userName;
                }
            }
        } catch (e: any) {
            // Deliberately suppress console error: 
            // 403 Forbidden is 100% expected here for non-admins natively attempting to hit /api/users/
        }

        const newUser: UserDTO = {
            id: userId,
            email: userEmail,
            name: userName,
            role: detectedRole,
            isActive: 'Active'
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

        const signupRole = normalizeRole(response.role);

        const newUser: UserDTO = {
            id: response.userId || Math.floor(Math.random() * 1000),
            email: userEmail,
            name: name,
            role: signupRole,
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
