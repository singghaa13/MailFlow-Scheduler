'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { EmailTable } from '@/components/EmailTable';
import { getQueueStats } from '@/lib/api';

interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export default function Dashboard(): React.ReactElement {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Implement polling or WebSocket for real-time stats
    const fetchStats = async (): Promise<void> => {
      try {
        const data = await getQueueStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Header title="Dashboard" />

      <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Queue Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600">Waiting</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.waiting}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-3xl font-bold text-blue-600">{stats.active}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-3xl font-bold text-red-600">{stats.failed}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600">Delayed</p>
              <p className="text-3xl font-bold text-purple-600">{stats.delayed}</p>
            </div>
          </div>
        )}

        {/* Recent Emails */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Recent Emails</h2>
          </div>
          <div className="p-6">
            {/* TODO: Implement email list fetching and display */}
            <EmailTable emails={[]} loading={loading} />
          </div>
        </div>
      </main>
    </>
  );
}
