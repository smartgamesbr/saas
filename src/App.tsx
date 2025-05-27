import React, { useState, useCallback } from 'react';
import { ActivityFormData, GeneratedPage, User } from './types';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import ActivityForm from './components/ActivityForm';
import GeneratedActivityView from './components/GeneratedActivityView';
import LoadingSpinner from './components/LoadingSpinner';
import Modal from './components/Modal';
import SubscriptionPlans from './components/SubscriptionPlans';
import MyActivitiesPage from './components/MyActivitiesPage';
import { SimulatedUserTier } from './types';

const App: React.FC = () => {
  const [currentActivityForm, setCurrentActivityForm] = useState<ActivityFormData | null>(null);
  const [generatedPages, setGeneratedPages] = useState<GeneratedPage[]>([]);
  const [viewingActivityName, setViewingActivityName] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSavingActivity, setIsSavingActivity] = useState<boolean>(false);
  const [currentGlobalStep, setCurrentGlobalStep] = useState<string>("");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [appError, setAppError] = useState<string | null>(null);
  const [showMyActivitiesPage, setShowMyActivitiesPage] = useState<boolean>(false);
  const [simulatedUserTier, setSimulatedUserTier] = useState<SimulatedUserTier>(null);

  const { user, signIn, signUp, signOut, subscribe, resetPasswordForEmail, isLoading: authIsLoading, authError, setAuthError } = useAuth();

  if (authIsLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <LoadingSpinner text="Carregando...\" size="lg"/>
    </div>;
  }

  const showGeneratorForm = !isGenerating && generatedPages.length === 0 && !appError && !showMyActivitiesPage;
  const showResultsView = !isGenerating && generatedPages.length > 0 && !showMyActivitiesPage;

  return (
    <Layout
      user={user}
      onLoginClick={() => {}}
      onLogoutClick={signOut}
      onMyActivitiesClick={() => setShowMyActivitiesPage(true)}
      onMySubscriptionClick={() => {}}
    >
      {!showMyActivitiesPage && (
        <div className="text-center mb-10 md:mb-12 bg-gradient-to-br from-primary-50 to-primary-100 py-12 rounded-2xl shadow-sm">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-700 font-display">
            Gerador de Atividades Escolares com IA
          </h1>
          <p className="mt-3 text-md sm:text-lg text-slate-600 max-w-3xl mx-auto px-4">
            Crie atividades personalizadas para diversas idades e matérias em minutos.
            Basta preencher os campos abaixo!
          </p>
        </div>
      )}

      {showGeneratorForm && <SubscriptionPlans onPremiumSubscribeClick={() => {}} />}

      {user?.isAdmin && !showMyActivitiesPage && (
        <div className="my-10 p-6 bg-primary-50/50 backdrop-blur-sm border border-primary-200 rounded-2xl shadow-lg max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-primary-800 mb-6 border-b border-primary-200 pb-4">
            Painel Administrativo
          </h2>
        </div>
      )}

      {appError && !isGenerating && !showMyActivitiesPage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl shadow-md max-w-3xl mx-auto" role="alert">
          <p className="font-bold">Erro:</p>
          <p>{appError}</p>
        </div>
      )}

      {showGeneratorForm && (
        <ActivityForm
          onSubmit={() => {}}
          isGenerating={isGenerating}
          currentUser={user}
          simulatedUserTier={simulatedUserTier}
          onSubscribeClick={() => {}}
        />
      )}

      {isGenerating && (
        <div className="bg-white/50 backdrop-blur-sm p-8 rounded-2xl shadow-lg">
          <LoadingSpinner text={currentGlobalStep || "Aguarde, estamos criando sua atividade..."} size="lg" />
        </div>
      )}

      {showResultsView && (
        <GeneratedActivityView
          pages={generatedPages}
          onDownloadPdf={() => {}}
          isGeneratingPdf={isGeneratingPdf}
          onClearResults={() => setGeneratedPages([])}
          onSaveActivity={() => {}}
          isSavingActivity={isSavingActivity}
          activityName={viewingActivityName}
        />
      )}

      {showMyActivitiesPage && user && (
        <MyActivitiesPage
          user={user}
          onViewActivity={() => {}}
          onBackToGenerator={() => setShowMyActivitiesPage(false)}
        />
      )}
    </Layout>
  );
};

export default App;