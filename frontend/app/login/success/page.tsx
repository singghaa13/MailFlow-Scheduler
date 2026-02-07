
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../context/auth-context';
import axios from 'axios';

export default function LoginSuccess() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            // Fetch user details using the token
            axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(response => {
                    login(token, response.data.user);
                    router.push('/dashboard');
                })
                .catch(err => {
                    console.error('Failed to fetch user', err);
                    router.push('/login?error=auth_failed');
                });
        } else {
            router.push('/login?error=no_token');
        }
    }, [searchParams, login, router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-xl">Logging you in...</div>
        </div>
    );
}
