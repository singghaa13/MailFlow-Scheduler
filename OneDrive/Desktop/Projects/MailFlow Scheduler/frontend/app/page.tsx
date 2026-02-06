'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { ComposeModal } from '@/components/ComposeModal';

export default function Home(): React.ReactElement {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Header title="MailFlow Scheduler" />

      <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md"
          >
            + Schedule Email
          </button>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Welcome to MailFlow Scheduler</h2>
          </div>
          <div className="px-6 py-8 text-center">
            <p className="text-gray-600 text-lg">
              Schedule your emails to be sent at the perfect time. Click the button above to get started.
            </p>
            {/* TODO: Implement email list component */}
          </div>
        </div>

        <ComposeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </main>
    </>
  );
}
