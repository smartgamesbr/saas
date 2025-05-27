
import React from 'react';
import { Subject, PageConfig } from '../types';
import { SUBJECT_OPTIONS } from '../constants';
import Dropdown from './Dropdown';

interface PageSubjectSelectorProps {
  pageConfigs: PageConfig[];
  onSubjectChange: (pageId: string, subject: Subject) => void;
  // errors?: Partial<Record<string, string>>; // Optional: for future per-dropdown error display
}

const PageSubjectSelector: React.FC<PageSubjectSelectorProps> = ({ pageConfigs, onSubjectChange }) => {
  if (pageConfigs.length === 0) {
    return null;
  }

  return (
    // This container ensures the section is visually distinct and has space for its content.
    // mt-1 because FormField's label has mb-1.
    // bg-white added to ensure it stands out if form has a different bg, or just blends if form is also white.
    <div className="mt-1 p-4 border border-slate-200 rounded-md shadow-sm bg-white">
      <h3 className="text-md font-semibold text-slate-700 mb-4">Matéria por Página:</h3>
      <div className="space-y-4"> {/* This provides consistent spacing between dropdowns */}
        {pageConfigs.map((page, index) => (
          <Dropdown<Subject>
            key={page.id}
            id={`page-subject-${page.id}`}
            // Label for each dropdown is now part of the Dropdown component itself
            label={`Matéria da Página ${index + 1}`}
            options={SUBJECT_OPTIONS}
            value={page.subject}
            onChange={(subject) => onSubjectChange(page.id, subject)}
            required
            // className can be used for additional specific styling if needed,
            // but base spacing is handled by the parent's space-y-4.
            // Error display for individual dropdowns could be added here if `errors` prop is used.
          />
        ))}
      </div>
    </div>
  );
};

export default PageSubjectSelector;
