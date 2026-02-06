'use client';

import { ReactNode } from 'react';

interface Email {
  id: string;
  to: string;
  subject: string;
  status: string;
  scheduledAt: string;
  createdAt: string;
}

interface EmailTableProps {
  emails: Email[];
  loading?: boolean;
}

export function EmailTable({ emails, loading = false }: EmailTableProps): ReactNode {
  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading emails...</p>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No emails scheduled yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse bg-white">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Recipient</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Subject</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Scheduled At</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Created</th>
          </tr>
        </thead>
        <tbody>
          {emails.map((email) => (
            <tr key={email.id} className="border-b hover:bg-gray-50">
              <td className="px-6 py-4 text-sm text-gray-900">{email.to}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{email.subject}</td>
              <td className="px-6 py-4 text-sm">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    email.status === 'sent'
                      ? 'bg-green-100 text-green-800'
                      : email.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {email.status}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                {new Date(email.scheduledAt).toLocaleString()}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {new Date(email.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
