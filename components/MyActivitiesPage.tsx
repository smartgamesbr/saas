
import React, { useState, useEffect, useCallback } from 'react';
import { User, SavedActivity, GeneratedPage } from '../types';
import { getSavedActivities, deleteSavedActivity } from '../supabaseClient';
import LoadingSpinner from './LoadingSpinner';
import { PostgrestError } from '@supabase/supabase-js'; // Import PostgrestError

interface MyActivitiesPageProps {
  user: User | null;
  onViewActivity: (pages: GeneratedPage[], activityName: string) => void;
  onBackToGenerator: () => void;
}

const MyActivitiesPage: React.FC<MyActivitiesPageProps> = ({ user, onViewActivity, onBackToGenerator }) => {
  const [savedActivities, setSavedActivities] = useState<SavedActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityToDelete, setActivityToDelete] = useState<SavedActivity | null>(null);


  const fetchActivities = useCallback(async () => {
    if (!user) {
      setError("Você precisa estar logado para ver suas atividades.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await getSavedActivities(user.id);
      if (fetchError) {
        throw fetchError; 
      }
      setSavedActivities(data || []);
    } catch (err) {
      console.error('Detalhes do erro ao buscar atividades:', err); 
      
      let userMessage = "Ocorreu um erro inesperado ao buscar suas atividades.";

      if (err instanceof PostgrestError) {
        const supabaseMessage = err.message;
        if (supabaseMessage.toLowerCase().includes("network error") || supabaseMessage.toLowerCase().includes("failed to fetch")) {
            userMessage = "Erro de rede ao buscar atividades. Verifique sua conexão com a internet.";
        } else if (supabaseMessage.toLowerCase().includes("rls") || supabaseMessage.toLowerCase().includes("security policy") || supabaseMessage.toLowerCase().includes("permission denied")) {
            userMessage = "Não foi possível buscar suas atividades devido a restrições de acesso. Verifique suas permissões.";
        } else if (supabaseMessage.includes("relation") && supabaseMessage.includes("does not exist")) {
            userMessage = "Erro ao buscar atividades: o recurso necessário (tabela 'saved_activities') não foi encontrado no banco de dados.";
        } else {
            userMessage = `Erro ao comunicar com a base de dados: ${supabaseMessage.substring(0,120)}${supabaseMessage.length > 120 ? '...' : ''}`;
        }
      } else if (err instanceof Error) {
        userMessage = `Erro na aplicação ao buscar atividades: ${err.message.substring(0,150)}${err.message.length > 150 ? '...' : ''}`;
      } else if (typeof err === 'string') {
        userMessage = `Problema ao buscar atividades: ${err.substring(0,150)}${err.length > 150 ? '...' : ''}`;
      }
      
      setError(`${userMessage} Por favor, tente novamente mais tarde ou contate o suporte se o problema persistir. (Dev: Verifique o console do navegador para detalhes técnicos).`);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleDeleteClick = (activity: SavedActivity) => {
    setActivityToDelete(activity);
  };

  const confirmDelete = async () => {
    if (!activityToDelete) return;
    setIsLoading(true); 
    setError(null);
    try {
      const { error: deleteError } = await deleteSavedActivity(activityToDelete.id);
      if (deleteError) {
        throw deleteError;
      }
      setSavedActivities(prev => prev.filter(act => act.id !== activityToDelete!.id));
    } catch (err) {
      console.error('Erro ao deletar atividade:', err);
      let userMessage = "Erro desconhecido ao deletar atividade.";
       if (err instanceof PostgrestError) {
         userMessage = `Erro da base de dados ao deletar: ${err.message}`;
       } else if (err instanceof Error) {
        userMessage = `Erro na aplicação ao deletar: ${err.message}`;
       } else if (typeof err === 'string') {
        userMessage = `Problema ao deletar: ${err}`;
       }
      setError(`${userMessage} (Dev: Verifique o console).`);
    } finally {
      setIsLoading(false);
      setActivityToDelete(null);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-10">
        <p className="text-slate-600 text-lg">Por favor, faça login para acessar suas atividades salvas.</p>
        <button
          onClick={onBackToGenerator} 
          className="mt-6 bg-sky-600 text-white py-2 px-6 rounded-md hover:bg-sky-700 transition-colors"
        >
          Voltar ao Gerador
        </button>
      </div>
    );
  }
  
  if (isLoading && savedActivities.length === 0) { 
    return <LoadingSpinner text="Carregando suas atividades..." size="lg" />;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-300">
        <h1 className="text-3xl font-bold text-sky-700">Minhas Atividades Salvas</h1>
        <button
          onClick={onBackToGenerator}
          className="bg-slate-200 text-slate-700 py-2 px-4 rounded-md hover:bg-slate-300 transition-colors text-sm font-medium"
        >
          &larr; Voltar ao Gerador
        </button>
      </div>

      {error && <p className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md" role="alert">{error}</p>}
      
      {isLoading && savedActivities.length > 0 && <div className="my-4"><LoadingSpinner text="Atualizando..." size="md" /></div>}


      {!isLoading && savedActivities.length === 0 && !error && (
        <div className="text-center py-12 bg-white shadow-md rounded-lg p-8">
          <svg className="mx-auto h-16 w-16 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          <h2 className="mt-4 text-xl font-semibold text-slate-700">Nenhuma Atividade Salva</h2>
          <p className="mt-2 text-sm text-slate-500">
            Você ainda não salvou nenhuma atividade. Gere uma nova atividade e salve-a para vê-la aqui!
          </p>
        </div>
      )}

      {savedActivities.length > 0 && (
        <div className="space-y-6">
          {savedActivities.map(activity => (
            <div key={activity.id} className="bg-white p-5 shadow-lg rounded-lg border border-slate-200 hover:shadow-xl transition-shadow duration-200">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-3">
                <h2 className="text-xl font-semibold text-sky-600 mb-2 sm:mb-0">{activity.activity_name}</h2>
                <p className="text-xs text-slate-500">
                  Salvo em: {new Date(activity.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Baseado em: {activity.form_data.age}, {activity.form_data.schoolYear}, {activity.form_data.numPages} página(s). 
                {activity.form_data.specificTopic && ` Tópico: ${activity.form_data.specificTopic}`}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-200">
                <button
                  onClick={() => onViewActivity(activity.generated_pages_data, activity.activity_name)}
                  className="flex-1 bg-sky-500 text-white py-2 px-4 rounded-md hover:bg-sky-600 transition-colors text-sm font-medium"
                  aria-label={`Visualizar atividade ${activity.activity_name}`}
                >
                  Visualizar
                </button>
                <button
                  onClick={() => handleDeleteClick(activity)}
                  className="flex-1 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors text-sm font-medium"
                  aria-label={`Deletar atividade ${activity.activity_name}`}
                >
                  Deletar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activityToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-800 mb-1">Confirmar Exclusão</h3>
            <p className="text-sm text-slate-600 mb-6">
              Tem certeza que deseja excluir a atividade "{activityToDelete.activity_name}"? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setActivityToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md border border-slate-300"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:bg-red-300"
              >
                {isLoading ? <LoadingSpinner size="sm" /> : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyActivitiesPage;
