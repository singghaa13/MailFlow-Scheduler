'use client';

import { useEffect, useState } from 'react';
import { getQueueStats, getEmails, toggleStar } from '@/lib/api';
import { initializeSocket, disconnectSocket } from '@/config/socket';
import { useAuth } from '@/context/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { Star, Clock, CheckCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function Dashboard(): React.ReactElement {
  const { token, loading: authLoading } = useAuth();
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeTab = searchParams.get('view') || 'scheduled';
  const searchQuery = searchParams.get('search') || '';

  useEffect(() => {
    if (!authLoading && !token) {
      router.push('/login');
    }
  }, [token, authLoading, router]);

  const fetchData = async (): Promise<void> => {
    setLoading(true);
    try {
      const [, emailsData] = await Promise.all([
        getQueueStats(),
        getEmails({
          limit: 50,
          status: searchParams.get('status') || (activeTab === 'scheduled' ? 'pending' : activeTab === 'sent' ? 'sent' : 'failed'),
          search: searchQuery || undefined
        })
      ]);
      // setStats(statsData); // Stats not used in this view design
      setEmails(emailsData.emails);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [activeTab, searchQuery, token]);

  useEffect(() => {
    const interval = setInterval(fetchData, 30000);
    if (token) {
      const socket = initializeSocket(token);
      socket.on('job-completed', fetchData);
      socket.on('job-failed', fetchData);
    }
    return () => {
      clearInterval(interval);
      disconnectSocket();
    };
  }, [token, activeTab]);

  const handleStarToggle = async (emailId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation to email detail
    try {
      const result = await toggleStar(emailId);
      // Update local state optimistically
      setEmails(prevEmails =>
        prevEmails.map(email =>
          email.id === emailId ? { ...email, isStarred: result.isStarred } : email
        )
      );
    } catch (error) {
      console.error('Failed to toggle star:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : emails.length === 0 ? (
        <div className="text-center py-24">
          <div className="bg-gray-50 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📭</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900">No {activeTab} emails</h3>
          <p className="text-gray-500 mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {emails.map((email) => (
            <div
              key={email.id}
              onClick={() => router.push(`/dashboard/emails/${email.id}`)}
              className="group flex items-center justify-between py-4 px-2 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold text-gray-900 text-sm truncate w-48">
                      To: {email.to}
                    </span>

                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                        ${activeTab === 'scheduled' ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {activeTab === 'scheduled' ? <Clock size={12} className="mr-1" /> : <CheckCircle size={12} className="mr-1" />}
                      {new Date(email.scheduledAt || email.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 truncate flex items-center gap-2">
                    <span className="font-medium text-gray-900">{email.subject}</span>
                    <span className="text-gray-400">-</span>
                    <span className="text-gray-500 truncate">{email.body.substring(0, 60)}...</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 pl-4">
                <button
                  onClick={(e) => handleStarToggle(email.id, e)}
                  className={`transition-colors ${email.isStarred ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}
                >
                  <Star size={18} fill={email.isStarred ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
