import React from 'react';
import { ActivityFormData, User, SimulatedUserTier } from '../types';

interface ActivityFormProps {
  onSubmit: (data: ActivityFormData) => void;
  isGenerating: boolean;
  currentUser: User | null;
  simulatedUserTier: SimulatedUserTier;
  onSubscribeClick: () => void;
}

const ActivityForm: React.FC<ActivityFormProps> = ({
  onSubmit,
  isGenerating,
  currentUser,
  simulatedUserTier,
  onSubscribeClick
}) => {
  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Criar Nova Atividade</h2>
      <form className="space-y-6" onSubmit={(e) => {
        e.preventDefault();
        // Implementation will be added later
      }}>
        {/* Form fields will be added here */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isGenerating}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {isGenerating ? 'Gerando...' : 'Gerar Atividade'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ActivityForm;