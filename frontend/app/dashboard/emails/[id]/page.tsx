'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { ArrowLeft, Clock, CheckCircle, AlertTriangle, Calendar } from 'lucide-react';

export default function EmailDetailsPage({ params }: { params: { id: string } }) {
    const { token, loading: authLoading } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !token) {
            router.push('/login');
        }
    }, [token, authLoading, router]);

    useEffect(() => {
        if (!token) return;

        const fetchEmail = async () => {
            // We reuse the list endpoint with search/filter or fetch specific if API supports it.
            // Ideally we should have GET /email/:id. 
            // If not, we might fail. Let's assume we need to implement GET /email/:id or use existing list logic?
            // Checking the previous implementation plan, it seems we didn't explicitly make a single GET endpoint.
            // Use the list endpoint with ID filter if possible? Or just try GET /email/:id if standard REST.
            // If that fails, I'll need to update backend.
            // Let's TRY GET /email/:id.
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
                const res = await axios.get(`${API_URL}/email/${params.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setEmail(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchEmail();
    }, [token, params.id]);

    if (loading) {
        return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
    }

    if (!email) {
        return <div className="p-8 text-center">Email not found</div>;
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 max-w-3xl mx-auto mt-8">
            <button
                onClick={() => router.back()}
                className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors"
            >
                <ArrowLeft size={18} className="mr-2" />
                Back to Dashboard
            </button>

            <div className="flex justify-between items-start mb-6">
                <h1 className="text-2xl font-bold text-gray-900">{email.subject}</h1>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border
                    ${email.status === 'completed' || email.status === 'sent' ? 'bg-green-100 text-green-800 border-green-200' :
                        email.status === 'failed' ? 'bg-red-100 text-red-800 border-red-200' :
                            'bg-orange-50 text-orange-700 border-orange-100'}`}>
                    {email.status === 'completed' || email.status === 'sent' ? <CheckCircle size={16} className="mr-2" /> :
                        email.status === 'failed' ? <AlertTriangle size={16} className="mr-2" /> :
                            <Clock size={16} className="mr-2" />}
                    {email.status}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8 bg-gray-50 p-6 rounded-xl">
                <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recipient</label>
                    <p className="text-gray-900 font-medium mt-1">{email.to}</p>
                </div>
                <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Scheduled For</label>
                    <div className="flex items-center mt-1 text-gray-900">
                        <Calendar size={16} className="mr-2 text-gray-400" />
                        {new Date(email.scheduledAt || email.createdAt).toLocaleString()}
                    </div>
                </div>
            </div>

            <div className="prose max-w-none">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Message Body</label>
                <div className="p-6 bg-gray-50 rounded-xl text-gray-800 whitespace-pre-wrap leading-relaxed border border-gray-100">
                    {email.body}
                </div>
            </div>
        </div>
    );
}
