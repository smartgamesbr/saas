import React from 'react';
import { GeneratedPage } from '../types';

interface GeneratedActivityViewProps {
  pages: GeneratedPage[];
  onDownloadPdf: () => void;
  isGeneratingPdf: boolean;
  onClearResults: () => void;
  onSaveActivity: () => void;
  isSavingActivity: boolean;
  activityName: string | null;
}

const GeneratedActivityView: React.FC<GeneratedActivityViewProps> = ({
  pages,
  onDownloadPdf,
  isGeneratingPdf,
  onClearResults,
  onSaveActivity,
  isSavingActivity,
  activityName
}) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {activityName || 'Atividade Gerada'}
        </h2>
        <div className="space-x-4">
          <button
            onClick={onSaveActivity}
            disabled={isSavingActivity}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {isSavingActivity ? 'Salvando...' : 'Salvar Atividade'}
          </button>
          <button
            onClick={onDownloadPdf}
            disabled={isGeneratingPdf}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {isGeneratingPdf ? 'Gerando PDF...' : 'Baixar PDF'}
          </button>
          <button
            onClick={onClearResults}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Nova Atividade
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {pages.map((page, index) => (
          <div key={index} className="border rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Página {index + 1}</h3>
            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: page.content }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GeneratedActivityView;