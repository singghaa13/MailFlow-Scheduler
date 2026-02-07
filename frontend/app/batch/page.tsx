'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { useAuth } from '@/context/auth-context';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function BatchSchedulePage() {
    const { token, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !token) {
            router.push('/login');
        }
    }, [token, authLoading, router]);

    const [formData, setFormData] = useState({
        recipients: '', // comma separated or new lines
        subject: '',
        body: '',
        scheduledAt: '',
        html: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        try {
            // Parse recipients
            const recipientsList = formData.recipients
                .split(/[\n,]/)
                .map((email) => email.trim())
                .filter((email) => email.length > 0);

            if (recipientsList.length === 0) {
                alert('Please enter at least one recipient email.');
                setLoading(false);
                return;
            }

            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

            const response = await axios.post(
                `${API_URL}/email/batch-schedule`,
                {
                    recipients: recipientsList,
                    subject: formData.subject,
                    body: formData.body,
                    html: formData.html,
                    scheduledAt: formData.scheduledAt,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setResult({ success: true, message: response.data.message });
            setFormData({
                recipients: '',
                subject: '',
                body: '',
                scheduledAt: '',
                html: '',
            });
        } catch (error: any) {
            console.error('Failed to batch schedule', error);
            setResult({
                success: false,
                message: error.response?.data?.error || 'Failed to schedule emails',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Header title="Batch Scheduling" />
            <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                <div className="bg-white shadow sm:rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Schedule Multiple Emails
                        </h3>
                        <div className="mt-2 max-w-xl text-sm text-gray-500">
                            <p>Enter multiple email addresses separated by commas or new lines.</p>
                        </div>

                        {result && (
                            <div
                                className={`mt-4 p-4 rounded-md ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                    }`}
                            >
                                {result.message}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Recipients</label>
                                <textarea
                                    rows={4}
                                    required
                                    placeholder="user1@example.com, user2@example.com"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={formData.recipients}
                                    onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Subject</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Body</label>
                                <textarea
                                    rows={4}
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={formData.body}
                                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">HTML (Optional)</label>
                                <textarea
                                    rows={4}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={formData.html}
                                    onChange={(e) => setFormData({ ...formData, html: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Scheduled At</label>
                                <input
                                    type="datetime-local"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={formData.scheduledAt}
                                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                                />
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                >
                                    {loading ? 'Scheduling...' : 'Batch Schedule Emails'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </>
    );
}
