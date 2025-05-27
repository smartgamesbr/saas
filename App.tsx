
import React, { useState, useCallback, useEffect } from 'react';
import { ActivityFormData, GeneratedPage, User, PageStructure, GeneratedImage, ActivitySection } from './types';
import { generateActivityPageStructure, generateSectionImage } from './services/geminiService';
import { createPdfFromHtmlElements } from './services/pdfService';
import { useAuth } from './hooks/useAuth';
import { supabase, saveActivity as saveActivityToDb } from './supabaseClient'; // Import supabase client for saveActivity
import { MAX_PAGES_FREE_TIER, MAX_PAGES_SUBSCRIBED, APP_DOMAIN } from './constants';
import Header from './components/Header';
import Footer from './components/Footer';
import ActivityForm from './components/ActivityForm';
import GeneratedActivityView from './components/GeneratedActivityView';
import LoadingSpinner from './components/LoadingSpinner';
import Modal from './components/Modal';
import SubscriptionPlans from './components/SubscriptionPlans'; 
import MyActivitiesPage from './components/MyActivitiesPage'; // New import
import { AuthError } from '@supabase/supabase-js';


// Ensure jsPDF & html2canvas are loaded for pdfService
declare global {
  interface Window {
    jspdf: any;
    html2canvas: any;
  }
}

export type SimulatedUserTier = 'free' | 'subscribed' | null;

const LOCAL_STORAGE_EMAIL_KEY = `rememberedEmail_${APP_DOMAIN}`;

const App: React.FC = () => {
  const [currentActivityForm, setCurrentActivityForm] = useState<ActivityFormData | null>(null);
  const [generatedPages, setGeneratedPages] = useState<GeneratedPage[]>([]);
  const [viewingActivityName, setViewingActivityName] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSavingActivity, setIsSavingActivity] = useState<boolean>(false);
  const [currentGlobalStep, setCurrentGlobalStep] = useState<string>("");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [appError, setAppError] = useState<string | null>(null);
  
  const { user, signIn, signUp, signOut, subscribe, resetPasswordForEmail, isLoading: authIsLoading, authError, setAuthError } = useAuth();
  
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false); 
  const [isSignUp, setIsSignUp] = useState(false); 
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [loginModalError, setLoginModalError] = useState<string | null>(null);
  const [loginModalSuccess, setLoginModalSuccess] = useState<string | null>(null);

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [selectedPlanNameForSubscription, setSelectedPlanNameForSubscription] = useState<string | null>(null);
  const [selectedPlanPriceForSubscription, setSelectedPlanPriceForSubscription] = useState<string | null>(null);
  const [selectedPlanFrequencyForSubscription, setSelectedPlanFrequencyForSubscription] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoModalTitle, setInfoModalTitle] = useState('');
  const [infoModalMessage, setInfoModalMessage] = useState('');

  const [simulatedUserTier, setSimulatedUserTier] = useState<SimulatedUserTier>(null);
  const [showMyActivitiesPage, setShowMyActivitiesPage] = useState<boolean>(false);


  useEffect(() => {
    const rememberedEmail = localStorage.getItem(LOCAL_STORAGE_EMAIL_KEY);
    if (rememberedEmail) {
      setLoginEmail(rememberedEmail);
      setRememberMe(true); 
    }
  }, []);


  useEffect(() => {
    if (authError) {
      if (authError.message === 'Invalid login credentials') {
        setLoginModalError("E-mail ou senha incorretos. Verifique os dados ou clique em 'Criar Conta' se ainda não tiver uma.");
      } else if (authError.message === 'User already registered') {
        setLoginModalError("Este e-mail já está registrado. Tente fazer login ou recuperar sua senha.");
      } else if (authError.message.includes("Email rate limit exceeded")) {
        setLoginModalError("Muitas tentativas de login ou criação de conta. Por favor, tente novamente mais tarde.");
      }
       else {
        setLoginModalError(authError.message);
      }
    } else {
      setLoginModalError(null);
    }
  }, [authError]);

  const openLoginModal = (startInSignUpMode = false, startInForgotPassMode = false) => {
    setIsSignUp(startInSignUpMode);
    setIsForgotPasswordMode(startInForgotPassMode);
    setLoginPassword('');
    setLoginModalError(null);
    setLoginModalSuccess(null);
    setAuthError(null);
    setShowLoginModal(true);
  };

  const handleNavigateToMyActivities = () => {
    if (!user) {
      openLoginModal();
      setAppError("Você precisa estar logado para ver suas atividades salvas.");
      return;
    }
    setGeneratedPages([]); // Clear any currently viewed/generated activity
    setCurrentActivityForm(null);
    setViewingActivityName(null);
    setAppError(null);
    setShowMyActivitiesPage(true);
  };

  // fix: Define handleSubscribeRequest
  const handleSubscribeRequest = (planName?: string, planPrice?: string, planFrequency?: string) => {
    if (!user) {
      openLoginModal();
      setAppError("Você precisa estar logado para gerenciar sua assinatura. Por favor, faça login ou crie uma conta.");
      return;
    }
    setSelectedPlanNameForSubscription(planName || "Premium");
    setSelectedPlanPriceForSubscription(planPrice || "R$XX,XX"); // Fallback if not provided
    setSelectedPlanFrequencyForSubscription(planFrequency || "/mês"); // Fallback
    setShowSubscriptionModal(true);
  };

  const handleFormSubmit = useCallback(async (formData: ActivityFormData) => {
    setCurrentActivityForm(formData); // Save current form data for potential saving later
    setViewingActivityName(null); // New generation, not viewing a saved one

    let currentMaxPagesAllowed = MAX_PAGES_FREE_TIER;
    if (simulatedUserTier === 'free') {
        currentMaxPagesAllowed = MAX_PAGES_FREE_TIER;
    } else if (simulatedUserTier === 'subscribed') {
        currentMaxPagesAllowed = MAX_PAGES_SUBSCRIBED;
    } else { 
        if (user?.isAdmin) {
            currentMaxPagesAllowed = Number.MAX_SAFE_INTEGER; 
        } else if (user?.isSubscribed) {
            currentMaxPagesAllowed = MAX_PAGES_SUBSCRIBED;
        }
    }

    if (!user && formData.numPages > MAX_PAGES_FREE_TIER) { 
       openLoginModal();
       setAppError(`Para gerar mais de ${MAX_PAGES_FREE_TIER} página, por favor, faça login ou crie uma conta.`);
       return;
    }
    if (user && !user.isAdmin && !user.isSubscribed && simulatedUserTier !== 'subscribed' && formData.numPages > MAX_PAGES_FREE_TIER) {
       handleSubscribeRequest("Plano para os Pais", "R$27,00", "/mês"); 
       setAppError(`Seu plano gratuito permite até ${MAX_PAGES_FREE_TIER} página. Para gerar mais páginas, por favor, assine.`);
       return;
    }
    
    setShowMyActivitiesPage(false); // Ensure we are not on "My Activities" page
    setIsGenerating(true);
    setAppError(null); 
    setGeneratedPages([]);
    const newPagesCollector: GeneratedPage[] = [];

    try {
      for (let i = 0; i < formData.numPages; i++) {
        const pageConfig = formData.pageConfigs[i];
        const currentPageNum = i + 1;
        setCurrentGlobalStep(`Gerando estrutura da página ${currentPageNum} de ${formData.numPages}...`);

        if (!pageConfig || !pageConfig.subject) {
          throw new Error(`Matéria não definida para a página ${currentPageNum}.`);
        }
        
        const pageStructure: PageStructure = await generateActivityPageStructure(formData, pageConfig, currentPageNum, formData.numPages);
        
        const pageImages: GeneratedImage[] = [];
        if (pageStructure.sections) {
          for (let j = 0; j < pageStructure.sections.length; j++) {
            const section = pageStructure.sections[j] as ActivitySection;
            if (section.imagePrompt) {
              setCurrentGlobalStep(`Gerando imagem para seção "${section.title || `seção ${j+1}`}" da página ${currentPageNum}...`);
              try {
                const base64ImageData = await generateSectionImage(section.imagePrompt);
                const imageId = `img-${crypto.randomUUID()}`;
                pageImages.push({
                  id: imageId,
                  base64Data: base64ImageData,
                  promptUsed: section.imagePrompt,
                });
                section.generatedImageId = imageId;
              } catch (imgErr) {
                const errorMessage = imgErr instanceof Error ? imgErr.message : String(imgErr);
                console.warn(`Falha ao gerar imagem para a seção ${j+1} da página ${currentPageNum}: ${errorMessage}. A seção pode não ter uma imagem.`);
                if (errorMessage.includes("Sua cota de geração de imagens foi excedida")) {
                    setAppError(errorMessage); 
                    throw imgErr; 
                }
              }
            }
          }
        }
        
        const completePage: GeneratedPage = {
          id: `page-${crypto.randomUUID()}`,
          pageNumber: currentPageNum,
          structure: pageStructure,
          images: pageImages,
        };
        newPagesCollector.push(completePage);
        setGeneratedPages([...newPagesCollector]); // Update progressively
      }
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Ocorreu um erro desconhecido.";
      setAppError(`Falha ao gerar atividade: ${message}`);
      setCurrentActivityForm(null); // Clear form data on error
    } finally {
      setIsGenerating(false);
      setCurrentGlobalStep("");
    }
  }, [user, simulatedUserTier]);

  const handleDownloadPdf = useCallback(async () => {
    if (generatedPages.length === 0) return;
    setIsGeneratingPdf(true);
    setAppError(null);
    try {
      const pageElementIds = generatedPages.map(p => `page-render-${p.id}`);
      await createPdfFromHtmlElements(pageElementIds, viewingActivityName || "atividade_gerada.pdf");
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Ocorreu um erro desconhecido.";
      setAppError(`Falha ao gerar PDF: ${message}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [generatedPages, viewingActivityName]);

  const handleClearResultsAndGoToGenerator = () => {
    setGeneratedPages([]);
    setCurrentActivityForm(null);
    setViewingActivityName(null);
    setAppError(null); 
    setShowMyActivitiesPage(false); // Ensure we are on generator page
  };

  const handleSaveCurrentActivity = async (activityName: string) => {
    if (!user) {
      openLoginModal();
      setAppError("Você precisa estar logado para salvar atividades.");
      return;
    }
    if (!currentActivityForm || generatedPages.length === 0) {
      setAppError("Não há atividade gerada para salvar ou os dados do formulário estão faltando.");
      return;
    }
    setIsSavingActivity(true);
    setAppError(null);
    try {
      const { data, error } = await saveActivityToDb(user.id, activityName, currentActivityForm, generatedPages);
      if (error) throw error;
      setInfoModalTitle("Atividade Salva!");
      setInfoModalMessage(`A atividade "${activityName}" foi salva com sucesso em "Minhas Atividades".`);
      setShowInfoModal(true);
      setViewingActivityName(activityName); // Mark current view as saved under this name
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? `Falha ao salvar atividade: ${err.message}` : "Erro desconhecido ao salvar atividade.";
      setAppError(message);
    } finally {
      setIsSavingActivity(false);
    }
  };
  
  const handleViewSavedActivity = (pages: GeneratedPage[], activityName: string) => {
    setGeneratedPages(pages);
    // We don't have the original ActivityFormData for the saved activity directly here
    // to set currentActivityForm. This might be an issue if we want to "re-save" a viewed activity
    // or modify it. For now, viewing is just display.
    setCurrentActivityForm(null); // Or retrieve if stored with SavedActivity
    setViewingActivityName(activityName);
    setShowMyActivitiesPage(false); // Go to GeneratedActivityView
    setAppError(null);
    setIsGenerating(false);
  };


  const handleAuthAction = async () => {
    setLoginModalError(null); 
    setLoginModalSuccess(null);
    setAuthError(null); 
    let error: AuthError | null = null;
    if (isSignUp) {
      error = await signUp(loginEmail, loginPassword);
    } else {
      error = await signIn(loginEmail, loginPassword);
    }

    if (error) {
      // Error messages are handled by the useEffect listening to authError
    } else {
      if (isSignUp && !error) {
        setLoginModalSuccess("Conta criada! Se necessário, verifique seu e-mail para confirmação antes de fazer login.");
        setIsSignUp(false);
        setLoginPassword(''); 
      } else if (!isSignUp && !error) { 
        if (rememberMe) {
          localStorage.setItem(LOCAL_STORAGE_EMAIL_KEY, loginEmail);
        } else {
          localStorage.removeItem(LOCAL_STORAGE_EMAIL_KEY);
        }
        setShowLoginModal(false); 
        setLoginPassword('');
        setIsSignUp(false); 
        setAppError(null); 
      }
    }
  };

  const handlePasswordKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !isForgotPasswordMode) {
      handleAuthAction();
    }
  };

  const handlePasswordRecovery = async () => {
    setLoginModalError(null);
    setLoginModalSuccess(null);
    setAuthError(null);
    if (!loginEmail) {
        setLoginModalError("Por favor, insira seu e-mail para recuperação.");
        return;
    }
    const { error } = await resetPasswordForEmail(loginEmail);
    if (error) {
        setLoginModalError(`Erro ao enviar link: ${error.message}`);
    } else {
        setLoginModalSuccess("Se o e-mail estiver cadastrado, um link de recuperação foi enviado!");
        setIsForgotPasswordMode(false); 
    }
  };
  
  const handleSubscriptionConfirm = async () => {
    setAppError(null);
    setIsProcessingPayment(true);

    setTimeout(async () => {
      const error = await subscribe();
      setIsProcessingPayment(false);
      setShowSubscriptionModal(false);
      if (error) {
          setAppError(`Falha na assinatura: ${error.message}`);
      } else {
          setInfoModalTitle("Assinatura Ativada (Simulação)");
          setInfoModalMessage("Sua assinatura (simulada) foi ativada com sucesso! Em um ambiente de produção, você teria sido redirecionado para o Mercado Pago, e sua assinatura seria confirmada via backend após o pagamento.");
          setShowInfoModal(true);
      }
    }, 2500); 
  };
  
  if (authIsLoading) { 
    return <div className="min-h-screen flex items-center justify-center bg-slate-100"><LoadingSpinner text="Carregando..." size="lg"/></div>;
  }
  
  const showGeneratorForm = !isGenerating && generatedPages.length === 0 && !appError && !showMyActivitiesPage;
  const showResultsView = !isGenerating && generatedPages.length > 0 && !showMyActivitiesPage;

  return (
    <div className="flex flex-col min-h-screen bg-slate-100">
      <Header 
        user={user} 
        onLoginClick={() => openLoginModal(false)} 
        onLogoutClick={signOut}
        onMySubscriptionClick={() => handleSubscribeRequest()}
        onMyActivitiesClick={handleNavigateToMyActivities}
      />
      
      <main className="flex-grow w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        
        {!showMyActivitiesPage && (
            <div className="text-center mb-10 md:mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-sky-700">Gerador de Atividades Escolares com IA</h1>
            <p className="mt-3 text-md sm:text-lg text-slate-600 max-w-3xl mx-auto">
                Crie atividades personalizadas para diversas idades e matérias em minutos. Basta preencher os campos abaixo!
            </p>
            </div>
        )}

        {showGeneratorForm && <SubscriptionPlans onPremiumSubscribeClick={handleSubscribeRequest} />}

        {user?.isAdmin && !showMyActivitiesPage && (
          <div className="my-10 p-6 bg-sky-50 border border-sky-300 rounded-xl shadow-lg max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-sky-800 mb-6 border-b border-sky-200 pb-4">Painel Administrativo</h2>
            <div className="mb-8 p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-sky-700 mb-3">Simulação de Usuário</h3>
              <p className="text-sm text-slate-600 mb-2">Teste os limites de página para diferentes tipos de usuários:</p>
              <div className="flex flex-wrap gap-x-6 gap-y-3">
                {(['Padrão (Conta Real)', 'Gratuito (Simulado)', 'Assinante (Simulado)'] as const).map((label, index) => {
                  const value: SimulatedUserTier | 'real' = index === 0 ? 'real' : (index === 1 ? 'free' : 'subscribed');
                  return (
                    <label key={value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="simulatedUserTier"
                        value={value}
                        checked={value === 'real' ? simulatedUserTier === null : simulatedUserTier === value}
                        onChange={() => setSimulatedUserTier(value === 'real' ? null : value)}
                        className="form-radio h-4 w-4 text-sky-600 border-slate-400 focus:ring-sky-500 focus:ring-offset-0"
                      />
                      <span className="text-sm text-slate-700">{label}</span>
                    </label>
                  );
                })}
              </div>
              {simulatedUserTier && (
                <p className="text-xs text-sky-600 mt-2 p-2 bg-sky-100 rounded-md">
                  Modo de simulação ativo: <span className="font-semibold">{simulatedUserTier === 'free' ? 'Usuário Gratuito' : 'Usuário Assinante'}</span>. Os limites de página refletirão esta simulação.
                </p>
              )}
               {!simulatedUserTier && (
                <p className="text-xs text-slate-500 mt-2 p-2 bg-slate-100 rounded-md">
                  Modo de simulação inativo. Usando status real da conta (Admin: acesso ilimitado).
                </p>
              )}
            </div>
             {/* Other Admin Panels */}
            <div className="mb-8 p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-sky-700 mb-3">Configurações de Pagamento (Mercado Pago)</h3>
              <p className="text-sm text-slate-600 italic">Funcionalidade em desenvolvimento.</p>
            </div>
            <div className="mb-8 p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-sky-700 mb-3">Gerenciamento de Planos</h3>
              <p className="text-sm text-slate-600 italic">Funcionalidade em desenvolvimento.</p>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-sky-700 mb-3">Gerenciamento de Usuários</h3>
              <p className="text-sm text-slate-600 italic">Funcionalidade em desenvolvimento.</p>
            </div>
          </div>
        )}

        {appError && !isGenerating && !showMyActivitiesPage && ( 
          <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-md shadow-md max-w-3xl mx-auto" role="alert">
            <p className="font-bold">Erro:</p>
            <p>{appError}</p>
          </div>
        )}

        {showGeneratorForm && (
             <ActivityForm 
                onSubmit={handleFormSubmit} 
                isGenerating={isGenerating}
                currentUser={user}
                simulatedUserTier={simulatedUserTier}
                onSubscribeClick={() => handleSubscribeRequest()}
            />
        )}

        {isGenerating && <LoadingSpinner text={currentGlobalStep || "Aguarde, estamos criando sua atividade..."} size="lg" />}
        
        {showResultsView && (
          <GeneratedActivityView
            pages={generatedPages}
            onDownloadPdf={handleDownloadPdf}
            isGeneratingPdf={isGeneratingPdf}
            onClearResults={handleClearResultsAndGoToGenerator}
            onSaveActivity={handleSaveCurrentActivity}
            isSavingActivity={isSavingActivity}
            activityName={viewingActivityName}
          />
        )}

        {showMyActivitiesPage && user && (
          <MyActivitiesPage
            user={user}
            onViewActivity={handleViewSavedActivity}
            onBackToGenerator={handleClearResultsAndGoToGenerator}
          />
        )}

      </main>
      
      <Footer />

      <Modal 
        title={isForgotPasswordMode ? "Recuperar Senha" : (isSignUp ? "Criar Conta" : "Login")} 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
      >
        {loginModalError && <p className="text-sm text-red-600 mb-3 bg-red-50 p-2 rounded">{loginModalError}</p>}
        {loginModalSuccess && <p className="text-sm text-green-600 mb-3 bg-green-50 p-2 rounded">{loginModalSuccess}</p>}
        
        <input 
          type="email" 
          value={loginEmail} 
          onChange={(e) => setLoginEmail(e.target.value)}
          placeholder="seu@email.com"
          className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md mb-3 focus:ring-sky-500 focus:border-sky-500 placeholder-slate-400"
          aria-label="Email"
          disabled={isGenerating || isProcessingPayment}
        />
        {!isForgotPasswordMode && (
            <input 
            type="password" 
            value={loginPassword} 
            onChange={(e) => setLoginPassword(e.target.value)}
            onKeyDown={handlePasswordKeyDown}
            placeholder="Senha"
            className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md mb-2 focus:ring-sky-500 focus:border-sky-500 placeholder-slate-400"
            aria-label="Senha"
            disabled={isGenerating || isProcessingPayment}
            />
        )}

        {!isForgotPasswordMode && !isSignUp && (
          <div className="flex items-center justify-between mb-4">
            <label htmlFor="rememberMeCheckbox" className="flex items-center text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                id="rememberMeCheckbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                disabled={isGenerating || isProcessingPayment}
              />
              <span className="ml-2">Lembrar-me</span>
            </label>
          </div>
        )}
        {(isForgotPasswordMode || isSignUp) && <div className="mb-4"></div>}

        {isForgotPasswordMode ? (
            <button 
                onClick={handlePasswordRecovery} 
                disabled={isGenerating || isProcessingPayment}
                className="w-full bg-sky-600 text-white py-2 px-4 rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-slate-400"
            >
                Enviar Link de Recuperação
            </button>
        ) : (
            <button 
                onClick={handleAuthAction} 
                disabled={isGenerating || isProcessingPayment}
                className="w-full bg-sky-600 text-white py-2 px-4 rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-slate-400"
            >
            {isSignUp ? 'Criar Conta' : 'Entrar'}
            </button>
        )}

        <div className="mt-4 text-center">
            {isForgotPasswordMode ? (
                <button 
                    onClick={() => { setIsForgotPasswordMode(false); setIsSignUp(false); setLoginModalError(null); setLoginModalSuccess(null); }}
                    className="text-sm text-sky-600 hover:text-sky-700 hover:underline"
                    disabled={isGenerating || isProcessingPayment}
                >
                    Voltar ao Login
                </button>
            ) : (
                <>
                    <button 
                        onClick={() => { setIsSignUp(!isSignUp); setIsForgotPasswordMode(false); setLoginModalError(null); setLoginModalSuccess(null); setLoginPassword(''); }}
                        className="text-sm text-sky-600 hover:text-sky-700 hover:underline mr-4"
                        disabled={isGenerating || isProcessingPayment}
                    >
                        {isSignUp ? 'Já tem uma conta? Entrar' : 'Não tem uma conta? Criar Conta'}
                    </button>
                    {!isSignUp && (
                        <button 
                            onClick={() => { setIsForgotPasswordMode(true); setLoginModalError(null); setLoginModalSuccess(null); setLoginPassword('');}}
                            className="text-sm text-slate-500 hover:text-slate-700 hover:underline"
                            disabled={isGenerating || isProcessingPayment}
                        >
                            Esqueceu a senha?
                        </button>
                    )}
                </>
            )}
        </div>
      </Modal>

      <Modal 
        title={`Assinar ${selectedPlanNameForSubscription || 'Plano Premium'}`} 
        isOpen={showSubscriptionModal} 
        onClose={() => { if (!isProcessingPayment) setShowSubscriptionModal(false); }}
      >
        <p className="text-sm text-slate-600 mb-2">
            {user?.email ? `${user.email}, para ` : "Para "}gerar atividades com mais páginas e ter acesso a todos os recursos, assine nosso plano selecionado.
        </p>
        <p className="text-lg font-semibold text-center text-sky-700 mb-1">
            Apenas {selectedPlanPriceForSubscription || 'R$19,90'}{selectedPlanFrequencyForSubscription || '/mês'}
        </p>
        <p className="text-xs text-slate-500 mb-4 text-center">(Você será redirecionado para o Mercado Pago para concluir a assinatura - Simulação)</p>
        
        <button 
            onClick={handleSubscriptionConfirm} 
            disabled={isGenerating || isProcessingPayment}
            className="w-full flex justify-center items-center bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-slate-400"
        >
          {isProcessingPayment ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processando com Mercado Pago...
            </>
          ) : (
            "Ir para Pagamento (Simulação)"
          )}
        </button>
        <button 
            onClick={() => setShowSubscriptionModal(false)} 
            disabled={isGenerating || isProcessingPayment}
            className="mt-2 w-full text-sm text-slate-600 py-2 px-4 rounded-md hover:bg-slate-100 border border-slate-300 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 disabled:opacity-50"
        >
          Talvez depois
        </button>
      </Modal>

      <Modal 
        title={infoModalTitle} 
        isOpen={showInfoModal} 
        onClose={() => setShowInfoModal(false)}
      >
        <p className="text-sm text-slate-600 mb-4 whitespace-pre-wrap">{infoModalMessage}</p>
        <button 
            onClick={() => setShowInfoModal(false)} 
            className="w-full bg-sky-600 text-white py-2 px-4 rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
        >
          Ok
        </button>
      </Modal>

    </div>
  );
};

export default App;
