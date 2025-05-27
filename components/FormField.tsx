
import React from 'react';

interface FormFieldProps {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  error?: string;
  className?: string;
  required?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({ label, htmlFor, children, error, className = "", required = false }) => {
  return (
    <div className={`mb-5 ${className}`}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default FormField;
    