'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/auth-context';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import {
    ArrowLeft, Paperclip, Clock, Upload,
    Undo, Redo, Type, Bold, Italic, Underline,
    AlignLeft, AlignCenter, List, Image as ImageIcon,
    Quote, Strikethrough, ChevronDown
} from 'lucide-react';
import Link from 'next/link';

export default function ComposePage() {
    const { user, token, loading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const attachmentInputRef = useRef<HTMLInputElement>(null);

    // Form States
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [recipients, setRecipients] = useState<string[]>([]);
    const [manualEmail, setManualEmail] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);

    // Advanced Options
    const [delay, setDelay] = useState(0);
    const [hourlyLimit, setHourlyLimit] = useState(0);

    const [message, setMessage] = useState('');
    const [showSchedulePopover, setShowSchedulePopover] = useState(false);
    const [scheduleDate, setScheduleDate] = useState('');

    useEffect(() => {
        if (!authLoading && !token) {
            router.push('/login');
        }
    }, [token, authLoading, router]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            complete: (results) => {
                const emails: string[] = [];
                results.data.forEach((row: any) => {
                    if (Array.isArray(row)) {
                        row.forEach(cell => {
                            if (typeof cell === 'string' && cell.includes('@')) emails.push(cell.trim());
                        });
                    } else if (typeof row === 'object') {
                        Object.values(row).forEach((val: any) => {
                            if (typeof val === 'string' && val.includes('@')) emails.push(val.trim());
                        });
                    }
                });
                setRecipients(Array.from(new Set(emails)));
            }
        });
    };

    const handleAddManualEmail = () => {
        if (manualEmail && manualEmail.includes('@')) {
            setRecipients(prev => [...prev, manualEmail.trim()]);
            setManualEmail('');
        }
    };

    const handleRemoveRecipient = (email: string) => {
        setRecipients(prev => prev.filter(e => e !== email));
    };

    const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            setAttachments(prev => [...prev, ...Array.from(files)]);
        }
    };

    const handleRemoveAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSend = async (isScheduled: boolean = false) => {
        setLoading(true);
        setMessage('');

        try {
            if (recipients.length === 0) {
                alert('Please add at least one recipient email address.');
                setLoading(false);
                return;
            }

            if (!subject || !body) {
                alert('Please fill in subject and message body.');
                setLoading(false);
                return;
            }

            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

            // Calculate startTime based on "Send Later" or immediate
            // For now, if scheduled, use the date picker, else now
            const start = isScheduled && scheduleDate ? new Date(scheduleDate).toISOString() : new Date().toISOString();

            await axios.post(
                `${API_URL}/email/batch-schedule`,
                {
                    recipients,
                    subject,
                    body,
                    scheduledAt: start,
                    delaySeconds: delay,
                    hourlyLimit: hourlyLimit
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setMessage(`Successfully scheduled ${recipients.length} emails!`);
            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);

        } catch (error: any) {
            console.error('Failed to schedule', error);
            setMessage('Error: ' + (error.response?.data?.error || 'Failed to schedule'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-xl font-semibold text-gray-800">Compose New Email</h1>
                </div>
                <div className="flex items-center gap-4">
                    <input
                        type="file"
                        ref={attachmentInputRef}
                        className="hidden"
                        multiple
                        onChange={handleAttachmentChange}
                    />
                    <button
                        onClick={() => attachmentInputRef.current?.click()}
                        className="text-gray-400 hover:text-gray-600"
                        title="Attach files"
                    >
                        <Paperclip size={20} />
                    </button>
                    <button
                        className="text-gray-400 hover:text-gray-600"
                        onClick={() => setShowSchedulePopover(!showSchedulePopover)}
                    >
                        <Clock size={20} />
                    </button>

                    <button
                        onClick={() => handleSend(false)}
                        disabled={loading}
                        className={`px-6 py-2 rounded-full bg-[#00C853] text-white font-medium hover:bg-[#009624] transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Sending...' : 'Send Now'}
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => handleSend(true)}
                            disabled={loading}
                            className={`px-6 py-2 rounded-full border border-[#00C853] text-[#00C853] font-medium hover:bg-green-50 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Sending...' : 'Send Later'}
                        </button>

                        {/* Simple Popover for Date */}
                        {showSchedulePopover && (
                            <div className="absolute right-0 mt-2 w-72 bg-white shadow-xl rounded-lg border border-gray-100 p-4 z-50">
                                <h3 className="text-sm font-semibold mb-3">Pick date & time</h3>
                                <input
                                    type="datetime-local"
                                    className="w-full border border-gray-200 rounded p-2 text-sm mb-3"
                                    onChange={(e) => setScheduleDate(e.target.value)}
                                />
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => setShowSchedulePopover(false)}
                                        className="text-xs text-gray-500"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => setShowSchedulePopover(false)}
                                        className="text-xs bg-[#00C853] text-white px-3 py-1 rounded"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Form */}
            <main className="max-w-5xl mx-auto px-6 py-8">
                <div className="space-y-6">
                    {/* From */}
                    <div className="flex items-center">
                        <label className="w-24 text-sm font-medium text-gray-700">From</label>
                        <div className="relative">
                            <button className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-md text-sm text-gray-900">
                                {user?.email || 'user@example.com'}
                                <ChevronDown size={14} className="text-gray-500" />
                            </button>
                        </div>
                    </div>

                    {/* To */}
                    <div className="flex items-start">
                        <label className="w-24 text-sm font-medium text-gray-700 pt-2">To</label>
                        <div className="flex-1 space-y-3">
                            {/* Manual Email Input */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="email"
                                    value={manualEmail}
                                    onChange={(e) => setManualEmail(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddManualEmail())}
                                    placeholder="Type email address and press Enter"
                                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00C853]/20 focus:border-[#00C853]"
                                />
                                <button
                                    onClick={handleAddManualEmail}
                                    className="px-4 py-2 bg-[#00C853] text-white text-sm font-medium rounded-lg hover:bg-[#009624] transition-colors"
                                >
                                    Add
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".csv,.txt"
                                    onChange={handleFileUpload}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2 px-4 py-2 border border-[#00C853] text-[#00C853] hover:bg-green-50 text-sm font-medium rounded-lg transition-colors"
                                >
                                    <Upload size={16} />
                                    CSV
                                </button>
                            </div>

                            {/* Recipients List */}
                            {recipients.length > 0 && (
                                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    {recipients.map((email) => (
                                        <span key={email} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                                            {email}
                                            <button
                                                onClick={() => handleRemoveRecipient(email)}
                                                className="ml-1 text-green-600 hover:text-green-800 font-bold"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                    <span className="text-xs text-gray-500 self-center">
                                        {recipients.length} recipient{recipients.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Subject */}
                    <div className="flex items-center">
                        <label className="w-24 text-sm font-medium text-gray-700">Subject</label>
                        <input
                            type="text"
                            className="flex-1 border-b border-gray-100 pb-2 focus:outline-none focus:border-green-500 text-gray-900 placeholder-gray-300"
                            placeholder="Subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        />
                    </div>

                    {/* Attachments Display */}
                    {attachments.length > 0 && (
                        <div className="flex items-start py-3 border-b border-gray-100">
                            <label className="w-24 text-sm font-medium text-gray-700 pt-1">Attachments</label>
                            <div className="flex-1 flex flex-wrap gap-2">
                                {attachments.map((file, index) => (
                                    <div key={index} className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs">
                                        <Paperclip size={14} />
                                        <span className="font-medium">{file.name}</span>
                                        <span className="text-blue-500">({(file.size / 1024).toFixed(1)} KB)</span>
                                        <button
                                            onClick={() => handleRemoveAttachment(index)}
                                            className="ml-1 text-blue-600 hover:text-blue-800 font-bold"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Delay & Hourly Limit */}
                    <div className="flex items-center gap-8 py-2">
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-medium text-gray-700">Delay between 2 emails</label>
                            <input
                                type="number"
                                className="w-16 border border-gray-200 rounded px-2 py-1 text-center text-sm focus:outline-none focus:border-green-500"
                                placeholder="00"
                                value={delay || ''}
                                onChange={(e) => setDelay(parseInt(e.target.value))}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-medium text-gray-700">Hourly Limit</label>
                            <input
                                type="number"
                                className="w-16 border border-gray-200 rounded px-2 py-1 text-center text-sm focus:outline-none focus:border-green-500"
                                placeholder="00"
                                value={hourlyLimit || ''}
                                onChange={(e) => setHourlyLimit(parseInt(e.target.value))}
                            />
                        </div>
                    </div>

                    {/* Editor Mockup */}
                    <div className="bg-[#F9FAFB] rounded-xl p-4 min-h-[400px] flex flex-col">
                        <div className="flex items-center gap-4 text-gray-400 mb-4 bg-white/50 p-2 rounded-lg w-fit">
                            <div className="flex items-center gap-2 border-r border-gray-200 pr-2">
                                <button className="hover:text-gray-600"><Undo size={18} /></button>
                                <button className="hover:text-gray-600"><Redo size={18} /></button>
                            </div>
                            <div className="flex items-center gap-2 border-r border-gray-200 pr-2">
                                <button className="hover:text-gray-600"><Type size={18} /></button>
                            </div>
                            <div className="flex items-center gap-2 border-r border-gray-200 pr-2">
                                <button className="hover:text-gray-600"><Bold size={18} /></button>
                                <button className="hover:text-gray-600"><Italic size={18} /></button>
                                <button className="hover:text-gray-600"><Underline size={18} /></button>
                            </div>
                            <div className="flex items-center gap-2 border-r border-gray-200 pr-2">
                                <button className="hover:text-gray-600"><AlignLeft size={18} /></button>
                                <button className="hover:text-gray-600"><AlignCenter size={18} /></button>
                            </div>
                            <div className="flex items-center gap-2 border-r border-gray-200 pr-2">
                                <button className="hover:text-gray-600"><List size={18} /></button>
                                <button className="hover:text-gray-600"><List size={18} /></button> {/* Duplicate icon for list style */}
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="hover:text-gray-600"><Quote size={18} /></button>
                                <button className="hover:text-gray-600"><ImageIcon size={18} /></button>
                                <button className="hover:text-gray-600"><Strikethrough size={18} /></button>
                            </div>
                        </div>

                        <textarea
                            className="flex-1 w-full bg-transparent border-none resize-none focus:outline-none text-gray-800 placeholder-gray-400"
                            placeholder="Type Your Reply..."
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                        />
                    </div>

                    {message && (
                        <div className={`p-4 rounded-md ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                            {message}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
