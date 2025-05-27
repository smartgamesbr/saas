import React from 'react';
import { APP_NAME } from '../../constants';
import { User } from '../../types';
import { Bars3Icon } from '@heroicons/react/24/outline';

interface HeaderProps {
  user: User | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onMyProfileClick?: () => void;
  onMySubscriptionClick?: () => void;
  onMyActivitiesClick: () => void;
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({
  user,
  onLoginClick,
  onMenuClick,
}) => {
  return (
    <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Menu button and Logo */}
          <div className="flex items-center">
            {user && (
              <button
                onClick={onMenuClick}
                className="lg:hidden p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              >
                <span className="sr-only">Open menu</span>
                <Bars3Icon className="h-6 w-6" />
              </button>
            )}
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10 ml-2 text-primary-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v2h-2v-2zm0 4h2v6h-2v-6z"/>
              </svg>
              <span className="ml-2 text-xl sm:text-2xl font-bold tracking-tight text-primary-700 font-display">
                {APP_NAME}
              </span>
            </div>
          </div>

          {/* Right side - Login button */}
          {!user && (
            <button
              onClick={onLoginClick}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;