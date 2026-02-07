import Link from 'next/link';
import { ReactNode } from 'react';
import { useAuth } from '@/context/auth-context';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps): ReactNode {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <nav className="hidden md:flex space-x-4">
                  <Link href="/dashboard" className="text-sm font-medium text-gray-500 hover:text-gray-900">Dashboard</Link>
                  <Link href="/compose" className="text-sm font-medium text-blue-600 hover:text-blue-700">Compose New Email</Link>
                </nav>
                <div className="flex items-center pl-4 border-l border-gray-200">
                  <div className="flex-shrink-0">
                    <span className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                      {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">{user.name || 'User'}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                  <button
                    onClick={logout}
                    className="ml-4 text-sm text-gray-500 hover:text-red-600"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <nav className="flex space-x-4">
                <Link href="/login" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Login</Link>
                <Link href="/register" className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium">Register</Link>
              </nav>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

