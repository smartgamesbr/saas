import React from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import { useAuth } from './hooks/useAuth';
import LoadingSpinner from './components/LoadingSpinner';

const App: React.FC = () => {
  const { user, signIn, signOut, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner text="Carregando..." size="lg" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Layout
        user={user}
        onLoginClick={() => {/* implement login logic */}}
        onLogoutClick={signOut}
        onMyActivitiesClick={() => {/* implement activities navigation */}}
        onMySubscriptionClick={() => {/* implement subscription logic */}}
      >
        {/* Your main content here */}
      </Layout>
    </ErrorBoundary>
  );
};

export default App;