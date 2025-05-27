import React, { useState, useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import { useAuth } from './hooks/useAuth';
import LoadingSpinner from './components/LoadingSpinner';
import ActivityForm from './components/ActivityForm';
import GeneratedActivityView from './components/GeneratedActivityView';
import MyActivitiesPage from './components/MyActivitiesPage';
import SubscriptionPlans from './components/SubscriptionPlans';
import { ActivityFormData, GeneratedPage } from './types';
import Logger from './utils/logger';

const App: React.FC = () => {
  const { user, signIn, signOut, subscribe, isLoading, authError } = useAuth();
  const [showMyActivitiesPage, setShowMyActivitiesPage] = useState(false);
  const [currentActivityForm, setCurrentActivityForm] = useState<ActivityFormData | null>(null);
  const [generatedPages, setGeneratedPages] = useState<GeneratedPage[]>([]);
  const [viewingActivityName, setViewingActivityName] = useState<string | null>(null);
  const [appInitialized, setAppInitialized] = useState(false);

  useEffect(() => {
    Logger.debug('App component mounted');
    const timer = setTimeout(() => {
      setAppInitialized(true);
    }, 500); // Small delay to ensure auth is ready
    
    return () => {
      clearTimeout(timer);
      Logger.debug('App component unmounting');
    };
  }, []);

  useEffect(() => {
    Logger.debug('Auth state changed:', { isLoading, hasUser: !!user, authError });
  }, [isLoading, user, authError]);

  // Only show loading state during initial load
  if (!appInitialized || (isLoading && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner text="Carregando...\" size="lg" />
      </div>
    );
  }

  const handleLoginClick = () => {
    // Implement login modal logic
  };

  const handleMyActivitiesClick = () => {
    if (!user) {
      handleLoginClick();
      return;
    }
    setShowMyActivitiesPage(true);
    setGeneratedPages([]);
    setCurrentActivityForm(null);
    setViewingActivityName(null);
  };

  const handleSubscriptionClick = () => {
    if (!user) {
      handleLoginClick();
      return;
    }
    // Implement subscription modal logic
  };

  const showGeneratorForm = !showMyActivitiesPage && generatedPages.length === 0;
  const showResultsView = !showMyActivitiesPage && generatedPages.length > 0;

  return (
    <ErrorBoundary>
      <Layout
        user={user}
        onLoginClick={handleLoginClick}
        onLogoutClick={signOut}
        onMyActivitiesClick={handleMyActivitiesClick}
        onMySubscriptionClick={handleSubscriptionClick}
      >
        {showGeneratorForm && (
          <div className="animate-fade-in">
            <div className="text-center mb-10">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-sky-700">
                Gerador de Atividades Escolares com IA
              </h1>
              <p className="mt-3 text-md sm:text-lg text-slate-600">
                Crie atividades personalizadas para diversas idades e matérias em minutos.
              </p>
            </div>
            <SubscriptionPlans onPremiumSubscribeClick={handleSubscriptionClick} />
            <ActivityForm
              onSubmit={(formData) => {
                setCurrentActivityForm(formData);
                // Implement activity generation logic
              }}
              isGenerating={false}
              currentUser={user}
              simulatedUserTier={null}
              onSubscribeClick={handleSubscriptionClick}
            />
          </div>
        )}

        {showResultsView && (
          <div className="animate-slide-up">
            <GeneratedActivityView
              pages={generatedPages}
              onDownloadPdf={() => {}}
              isGeneratingPdf={false}
              onClearResults={() => {
                setGeneratedPages([]);
                setCurrentActivityForm(null);
                setViewingActivityName(null);
              }}
              onSaveActivity={() => {}}
              isSavingActivity={false}
              activityName={viewingActivityName}
            />
          </div>
        )}

        {showMyActivitiesPage && user && (
          <div className="animate-slide-up">
            <MyActivitiesPage
              user={user}
              onViewActivity={(pages, activityName) => {
                setGeneratedPages(pages);
                setViewingActivityName(activityName);
                setShowMyActivitiesPage(false);
              }}
              onBackToGenerator={() => {
                setShowMyActivitiesPage(false);
                setGeneratedPages([]);
                setCurrentActivityForm(null);
                setViewingActivityName(null);
              }}
            />
          </div>
        )}
      </Layout>
    </ErrorBoundary>
  );
};

export default App;