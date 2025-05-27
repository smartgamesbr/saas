
import React, { useState, useCallback, useEffect } from 'react';
import { ActivityFormData, Age, SchoolYear, Subject, ActivityComponent, PageConfig, User } from '../types';
import { 
  AGE_OPTIONS, SCHOOL_YEAR_OPTIONS, NUM_PAGES_OPTIONS, 
  SUBJECT_OPTIONS, ACTIVITY_COMPONENT_OPTIONS, MAX_PAGES_FREE_TIER, MAX_PAGES_SUBSCRIBED
} from '../constants';
import Dropdown from './Dropdown';
import CheckboxGroup from './CheckboxGroup';
import PageSubjectSelector from './PageSubjectSelector';
import FormField from './FormField'; 
import { SimulatedUserTier } from '../App'; // Import SimulatedUserTier type

interface ActivityFormProps {
  onSubmit: (data: ActivityFormData) => void;
  isGenerating: boolean;
  currentUser: User | null;
  simulatedUserTier: SimulatedUserTier; 
  onSubscribeClick: () => void;
}

const initialFormData: ActivityFormData = {
  age: "",
  schoolYear: "",
  numPages: 1,
  pageConfigs: [{ id: crypto.randomUUID(), subject: "" }],
  activityComponents: [],
  specificTopic: "",
};

const ActivityForm: React.FC<ActivityFormProps> = ({ onSubmit, isGenerating, currentUser, simulatedUserTier, onSubscribeClick }) => {
  const [formData, setFormData] = useState<ActivityFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof ActivityFormData | string, string>>>({});

  const maxPagesAllowed = (() => {
    if (simulatedUserTier === 'free') return MAX_PAGES_FREE_TIER;
    if (simulatedUserTier === 'subscribed') return MAX_PAGES_SUBSCRIBED;
    if (currentUser?.isAdmin) return Number.MAX_SAFE_INTEGER; 
    if (currentUser?.isSubscribed) return MAX_PAGES_SUBSCRIBED;
    return MAX_PAGES_FREE_TIER;
  })();
  
  const isActuallyFreeUser = currentUser && !currentUser.isAdmin && !currentUser.isSubscribed;

  const handleInputChange = <K extends keyof ActivityFormData,>(
    field: K,
    value: ActivityFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({...prev, [field]: undefined}));
    }
  };

  const handleNumPagesChange = (num: number) => {
    setFormData((prev) => {
      const newPageConfigs: PageConfig[] = [];
      for (let i = 0; i < num; i++) {
        if (i < prev.pageConfigs.length) {
          newPageConfigs.push(prev.pageConfigs[i]);
        } else {
          newPageConfigs.push({ id: crypto.randomUUID(), subject: "" });
        }
      }
      // If reducing pages, also trim selected components if they exceed the new numPages
      const updatedActivityComponents = prev.activityComponents.length > num 
                                        ? prev.activityComponents.slice(0, num) 
                                        : prev.activityComponents;

      return { ...prev, numPages: num, pageConfigs: newPageConfigs, activityComponents: updatedActivityComponents };
    });
     if (errors.pageConfigs) {
      setErrors(prev => ({...prev, pageConfigs: undefined}));
    }
     if (errors.numPages) {
      setErrors(prev => ({...prev, numPages: undefined}));
    }
    if (errors.activityComponents) {
      setErrors(prev => ({...prev, activityComponents: undefined}));
    }
  };

  const handleSubjectChange = (pageId: string, subject: Subject) => {
    setFormData((prev) => ({
      ...prev,
      pageConfigs: prev.pageConfigs.map((pc) =>
        pc.id === pageId ? { ...pc, subject } : pc
      ),
    }));
    if (errors.pageConfigs) {
      setErrors(prev => ({...prev, pageConfigs: undefined}));
    }
  };
  
  const handleComponentChange = (selectedComponents: ActivityComponent[]) => {
    handleInputChange('activityComponents', selectedComponents as ActivityComponent[]);
     if (errors.activityComponents) { // Clear error if user makes a selection
      setErrors(prev => ({ ...prev, activityComponents: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ActivityFormData | string, string>> = {};
    if (!formData.age) newErrors.age = "Selecione a idade.";
    if (!formData.schoolYear) newErrors.schoolYear = "Selecione o ano escolar.";
    
    if (formData.numPages < 1) newErrors.numPages = `Número de páginas deve ser pelo menos 1.`;
    else if (formData.numPages > maxPagesAllowed) {
        if (isActuallyFreeUser && simulatedUserTier !== 'subscribed') {
             newErrors.numPages = `Seu plano atual permite no máximo ${MAX_PAGES_FREE_TIER} página(s). Assine para mais.`;
        } else if (simulatedUserTier) { 
            newErrors.numPages = `Simulação ativa: Limite de ${maxPagesAllowed} página(s) para este teste.`;
        } else if (currentUser && !currentUser.isAdmin && currentUser.isSubscribed && formData.numPages > MAX_PAGES_SUBSCRIBED){ 
            newErrors.numPages = `Seu plano de assinante permite até ${MAX_PAGES_SUBSCRIBED} páginas.`;
        }
    }

    if (formData.activityComponents.length === 0) {
      newErrors.activityComponents = "Selecione pelo menos um componente.";
    } else if (formData.activityComponents.length > formData.numPages) {
      // This case should ideally be prevented by the CheckboxGroup's maxSelectable logic
      newErrors.activityComponents = `Você selecionou ${formData.activityComponents.length} componentes, mas apenas ${formData.numPages} página(s). Ajuste a seleção.`;
    }
    
    let pageConfigError = false;
    formData.pageConfigs.forEach((pc, index) => {
      if (!pc.subject) {
        newErrors[`pageConfigs[${index}].subject`] = `Matéria da página ${index + 1} é obrigatória.`;
        pageConfigError = true;
      }
    });
    if(pageConfigError) newErrors.pageConfigs = "Todas as páginas devem ter uma matéria selecionada.";


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      if (formData.numPages > maxPagesAllowed) {
          return; 
      }
      onSubmit(formData);
    }
  };
  
  const showSubscriptionPrompt = formData.numPages > MAX_PAGES_FREE_TIER && 
                                 isActuallyFreeUser &&
                                 simulatedUserTier !== 'subscribed';

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 sm:p-8 rounded-lg shadow-xl max-w-3xl mx-auto">
      <FormField label="Para qual idade?" htmlFor="age" required error={errors.age}>
        <Dropdown<Age>
          id="age"
          label="" 
          options={AGE_OPTIONS}
          value={formData.age}
          onChange={(val) => handleInputChange('age', val)}
        />
      </FormField>

      <FormField label="Ano escolar:" htmlFor="schoolYear" required error={errors.schoolYear}>
        <Dropdown<SchoolYear>
          id="schoolYear"
          label=""
          options={SCHOOL_YEAR_OPTIONS}
          value={formData.schoolYear}
          onChange={(val) => handleInputChange('schoolYear', val)}
        />
      </FormField>

      <FormField label="Quantas páginas a atividade vai ter?" htmlFor="numPages" required error={errors.numPages?.toString()}>
         <Dropdown<number>
          id="numPages"
          label=""
          options={NUM_PAGES_OPTIONS} 
          value={formData.numPages}
          onChange={handleNumPagesChange}
        />
      </FormField>
      
      {showSubscriptionPrompt && (
         <div className="p-3 bg-amber-100 border-l-4 border-amber-500 text-amber-700 rounded-md">
           <p className="font-medium">Limite de páginas excedido!</p>
           <p className="text-sm">Seu plano atual permite até {MAX_PAGES_FREE_TIER} página(s). Para gerar mais páginas, por favor <button type="button" onClick={onSubscribeClick} className="underline font-semibold hover:text-amber-800">assine um plano</button>.</p>
         </div>
       )}
       
      {currentUser?.isAdmin && simulatedUserTier && formData.numPages > maxPagesAllowed && (
         <div className="p-3 bg-sky-100 border-l-4 border-sky-500 text-sky-700 rounded-md">
           <p className="font-medium">Nota de Simulação (Admin):</p>
           <p className="text-sm">O limite de {maxPagesAllowed} página(s) está ativo devido à simulação de usuário "{simulatedUserTier}".</p>
         </div>
      )}


      {formData.pageConfigs.length > 0 && (
        <FormField 
            label="Configure cada página:" 
            htmlFor="pageSubjectSelector" 
            required 
            error={errors.pageConfigs}
        >
             <PageSubjectSelector
                pageConfigs={formData.pageConfigs}
                onSubjectChange={handleSubjectChange}
              />
        </FormField>
      )}

      <FormField label="Componentes da atividade (máx. 1 por página):" htmlFor="activityComponents" required error={errors.activityComponents}>
        <CheckboxGroup<ActivityComponent>
          id="activityComponents"
          label=""
          options={ACTIVITY_COMPONENT_OPTIONS}
          selectedValues={formData.activityComponents}
          onChange={handleComponentChange}
          maxSelectable={formData.numPages}
        />
        {formData.numPages > 0 && (
             <p className="mt-1 text-xs text-slate-500">
                Você pode selecionar até {formData.numPages} componente(s) para {formData.numPages} página(s). Selecionados: {formData.activityComponents.length}.
            </p>
        )}
      </FormField>
      
      <FormField label="Gostaria que essa atividade fosse de algum assunto específico? Qual?" htmlFor="specificTopic">
        <input
          type="text"
          id="specificTopic"
          value={formData.specificTopic}
          onChange={(e) => handleInputChange('specificTopic', e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm placeholder-slate-400 disabled:bg-slate-100 disabled:text-slate-500"
          placeholder="Ex: Adição com dois dígitos, Dinossauros, Sistema Solar"
        />
      </FormField>

      <button
        type="submit"
        disabled={isGenerating || (formData.numPages > maxPagesAllowed)}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors duration-150"
      >
        {isGenerating ? (
          <div className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Gerando Atividade...
          </div>
        ) : (
          'Gerar Atividade com IA'
        )}
      </button>
    </form>
  );
};

export default ActivityForm;
