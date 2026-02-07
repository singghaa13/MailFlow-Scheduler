"use client";

import React from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Send, Clock, PenSquare, LogOut, Search, Bell } from 'lucide-react';
import { useAuth } from '../../context/auth-context';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, logout } = useAuth();
    const router = useRouter(); // Import this
    const searchParams = useSearchParams();
    const currentView = searchParams.get('view') || 'scheduled';

    const [showFilter, setShowFilter] = React.useState(false);
    const [showNotifications, setShowNotifications] = React.useState(false);
    const [stats, setStats] = React.useState<any>(null);

    // Fetch stats for notifications
    React.useEffect(() => {
        async function fetchStats() {
            try {
                const { getQueueStats } = await import('../../lib/api');
                const data = await getQueueStats();
                setStats(data);
            } catch (e) {
                console.error(e);
            }
        }
        if (showNotifications) {
            fetchStats();
        }
    }, [showNotifications]);

    const handleFilter = (status: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (status === 'all') {
            params.delete('status');
        } else {
            params.set('status', status);
        }
        router.push(`/dashboard?${params.toString()}`);
        setShowFilter(false);
    };

    return (
        <div className="flex h-screen bg-white">
            {/* Sidebar */}
            <aside className="w-64 border-r border-gray-100 flex flex-col bg-white">
                <div className="p-6">
                    <h1 className="text-2xl font-black tracking-tighter text-gray-900">ONG</h1>
                </div>

                {/* User Profile Dropdown / Card */}
                <div className="px-4 mb-6">
                    <Link href="/dashboard/profile" className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                        <div
                            className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: user?.avatar || '#4ECDC4' }}
                        >
                            {user?.name?.[0] || user?.email?.[0] || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'User'}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                    </Link>
                </div>

                <div className="px-4">
                    <Link href="/compose" className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-white border-2 border-[#00C853] text-[#00C853] hover:bg-green-50 font-semibold rounded-full transition-colors mb-8">
                        <PenSquare size={18} />
                        Compose
                    </Link>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Core</p>

                    <Link
                        href="/dashboard?view=scheduled"
                        className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-r-full mr-2 transition-colors ${currentView === 'scheduled'
                            ? 'bg-[#E8F5E9] text-[#00C853]'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <Clock size={18} />
                        Scheduled
                        {/* <span className="ml-auto text-xs bg-green-100 text-green-600 py-0.5 px-2 rounded-full">12</span> */}
                    </Link>

                    <Link
                        href="/dashboard?view=sent"
                        className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-r-full mr-2 transition-colors ${currentView === 'sent'
                            ? 'bg-[#E8F5E9] text-[#00C853]'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <Send size={18} />
                        Sent
                        Sent
                        {/* <span className="ml-auto text-xs text-gray-400">785</span> */}
                    </Link>

                    <Link
                        href="/dashboard?view=failed"
                        className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-r-full mr-2 transition-colors ${currentView === 'failed'
                            ? 'bg-red-50 text-red-600'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <div className="h-[18px] w-[18px] flex items-center justify-center">⚠️</div>
                        Failed
                    </Link>
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button onClick={logout} className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors">
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Header with Search */}
                <header className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-50">
                    <div className="flex-1 max-w-2xl">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search size={18} className="text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2.5 border-none rounded-full bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-200 sm:text-sm"
                                placeholder="Search"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                        <div className="relative">
                            <button
                                onClick={() => setShowFilter(!showFilter)}
                                className={`text-gray-400 hover:text-gray-600 ${showFilter ? 'text-blue-500' : ''}`}
                            >
                                <div className="h-5 w-5">
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                    </svg>
                                </div>
                            </button>
                            {showFilter && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-100">
                                    <button onClick={() => handleFilter('all')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">All Statuses</button>
                                    <button onClick={() => handleFilter('pending')} className="block w-full text-left px-4 py-2 text-sm text-yellow-600 hover:bg-gray-100">Pending</button>
                                    <button onClick={() => handleFilter('completed')} className="block w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-gray-100">Completed</button>
                                    <button onClick={() => handleFilter('failed')} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Failed</button>
                                </div>
                            )}
                        </div>

                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <Bell size={20} />
                                {/* Red dot if failed jobs > 0 (optimistic or we can fetch stats) */}
                            </button>
                            {showNotifications && (
                                <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-100 p-4">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Queue Status</h3>
                                    {stats ? (
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between text-yellow-600"><span>Waiting</span> <span>{stats.waiting}</span></div>
                                            <div className="flex justify-between text-blue-600"><span>Active</span> <span>{stats.active}</span></div>
                                            <div className="flex justify-between text-green-600"><span>Completed</span> <span>{stats.completed}</span></div>
                                            <div className="flex justify-between font-bold text-red-600"><span>Failed</span> <span>{stats.failed}</span></div>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-500">Loading stats...</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
