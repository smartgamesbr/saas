import React from 'react';
import { User } from '../types';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from '../components/Footer';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onMyActivitiesClick: () => void;
  onMySubscriptionClick: () => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  user,
  onLoginClick,
  onLogoutClick,
  onMyActivitiesClick,
  onMySubscriptionClick,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        user={user}
        onLoginClick={onLoginClick}
        onMenuClick={() => setIsSidebarOpen(true)}
      />

      <div className="flex-1 flex">
        {user && (
          <Sidebar
            user={user}
            onMyActivitiesClick={onMyActivitiesClick}
            onMySubscriptionClick={onMySubscriptionClick}
            onMyProfileClick={() => {}}
            onLogoutClick={onLogoutClick}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
        )}

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {children}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default Layout;