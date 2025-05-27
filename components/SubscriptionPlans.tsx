
import React from 'react';
// import { MAX_PAGES_FREE_TIER, MAX_PAGES_SUBSCRIBED } from '../constants'; // Not directly used in features list now

interface SubscriptionPlansProps {
  // Changed to accept plan details
  onPremiumSubscribeClick: (planName: string, planPrice: string, planFrequency: string) => void;
}

interface Plan {
  name: string;
  price: string;
  frequency: string;
  features: string[];
  actionText: string;
  isPopular: boolean;
  actionDisabled?: boolean;
  actionHandler?: () => void; // Keep for free plan or other custom actions if needed
  actionLink?: string;
}

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ onPremiumSubscribeClick }) => {
  const plans: Plan[] = [
    {
      name: "Plano Gratuito",
      price: "R$0",
      frequency: "/mês",
      features: [
        "+ de 15 matérias",
        "Até 2 atividades mensais",
        "1 página por atividade",
        "Acesso até 2 componentes (ex: Texto perguntas + Atividade para colorir)",
        "Geração de PDF pronto para imprimir",
      ],
      actionText: "Seu Plano Atual", // This text might need dynamic adjustment based on user status in App.tsx later
      actionDisabled: true,
      isPopular: false,
    },
    {
      name: "Plano para os Pais",
      price: "R$27,00",
      frequency: "/mês",
      features: [
        "+ de 15 matérias",
        "Até 15 atividades mensais",
        "2 páginas por atividade",
        "Acesso a todos os componentes (ex: Caça-palavras, Completar lacunas, etc.)",
        "Geração de PDF pronto para imprimir",
      ],
      actionText: "Assine Agora",
      // actionHandler will be () => onPremiumSubscribeClick(plan.name, plan.price, plan.frequency)
      isPopular: true,
    },
    {
      name: "Plano para o Professor",
      price: "R$47,00",
      frequency: "/mês",
      features: [
        "+ de 15 matérias",
        "Até 30 atividades mensais",
        "2 páginas por atividade",
        "Acesso a todos os componentes (ex: Marcar X, Verdadeiro ou Falso, etc.)",
        "Atividades de acordo com a BNCC.", 
        "Geração de PDF pronto para imprimir",
      ],
      actionText: "Assine Agora",
      // actionHandler will be () => onPremiumSubscribeClick(plan.name, plan.price, plan.frequency)
      isPopular: false,
    },
  ];

  return (
    <section className="py-8 md:py-12 bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-sky-700 sm:text-4xl">
            Nossos Planos
          </h2>
          <p className="mt-3 text-md text-slate-600 max-w-2xl mx-auto">
            Escolha o plano que melhor se adapta às suas necessidades e comece a criar atividades incríveis hoje mesmo!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-xl shadow-lg p-6 flex flex-col ${plan.isPopular ? 'border-2 border-sky-500 relative' : 'border border-slate-200'}`}
            >
              {plan.isPopular && (
                <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 text-xs text-white bg-sky-500 rounded-full font-semibold tracking-wide uppercase">
                    Mais Popular
                  </span>
                </div>
              )}
              <h3 className="text-xl font-semibold text-slate-800 text-center">{plan.name}</h3>
              <div className="mt-4 text-center text-slate-900">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.frequency && <span className="text-base font-medium text-slate-500">{plan.frequency}</span>}
              </div>
              <ul className="mt-6 space-y-3 text-sm text-slate-600 flex-grow">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="flex-shrink-0 h-5 w-5 text-green-500 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                {/* Conditional rendering for action buttons */}
                {plan.name === "Plano Gratuito" ? (
                   <button
                        disabled
                        className={`w-full px-6 py-3 text-base font-medium rounded-md shadow-sm transition-colors duration-150
                        text-slate-500 bg-slate-200 cursor-not-allowed
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400`}
                      >
                        {plan.actionText}
                    </button>
                ) : (
                  <button
                    onClick={() => onPremiumSubscribeClick(plan.name, plan.price, plan.frequency)}
                    disabled={!!plan.actionDisabled} // Should be false for these plans unless explicitly disabled
                    className={`w-full px-6 py-3 text-base font-medium rounded-md shadow-sm transition-colors duration-150
                      ${plan.isPopular 
                        ? 'text-white bg-sky-600 hover:bg-sky-700 focus:ring-sky-500' 
                        : 'text-sky-700 bg-sky-100 hover:bg-sky-200 focus:ring-sky-300'}
                      ${plan.actionDisabled ? 'opacity-50 cursor-not-allowed bg-slate-200 text-slate-500 hover:bg-slate-200' : ''}
                      focus:outline-none focus:ring-2 focus:ring-offset-2`}
                  >
                    {plan.actionText}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SubscriptionPlans;
