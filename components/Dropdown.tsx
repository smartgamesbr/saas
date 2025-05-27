
import React from 'react';

interface DropdownOption<T extends string | number> {
  value: T;
  label: string;
}

interface DropdownProps<T extends string | number> {
  id: string;
  label: string;
  options: DropdownOption<T>[];
  value: T | "";
  onChange: (value: T) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

const Dropdown = <T extends string | number,>(
  { id, label, options, value, onChange, required = false, disabled = false, className = "" }: DropdownProps<T>
): React.ReactElement => {
  return (
    <div className={`${className}`}>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        id={id}
        name={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        required={required}
        disabled={disabled}
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white text-slate-900 border-slate-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md shadow-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
        aria-label={label}
      >
        <option value="" disabled={required} hidden={required}>
          Selecione...
        </option>
        {options.map((option) => (
          <option key={option.value.toString()} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Dropdown;