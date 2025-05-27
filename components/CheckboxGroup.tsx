
import React from 'react';

interface CheckboxOption<T extends string> {
  value: T;
  label: string;
}

interface CheckboxGroupProps<T extends string> {
  id: string;
  label: string;
  options: CheckboxOption<T>[];
  selectedValues: T[];
  onChange: (selected: T[]) => void;
  required?: boolean;
  className?: string;
  maxSelectable?: number; // New prop
}

const CheckboxGroup = <T extends string,>(
  { id, label, options, selectedValues, onChange, required = false, className = "", maxSelectable }: CheckboxGroupProps<T>
): React.ReactElement => {
  const handleChange = (value: T) => {
    const isCurrentlySelected = selectedValues.includes(value);
    let newSelectedValues;

    if (isCurrentlySelected) {
      newSelectedValues = selectedValues.filter((v) => v !== value);
    } else {
      // Only allow adding if not exceeding maxSelectable (if defined)
      if (maxSelectable !== undefined && selectedValues.length >= maxSelectable) {
        return; // Do not add new item
      }
      newSelectedValues = [...selectedValues, value];
    }
    onChange(newSelectedValues);
  };

  return (
    <fieldset className={`mb-4 ${className}`}>
      <legend className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </legend>
      <div className="mt-2 space-y-2">
        {options.map((option) => {
          const isDisabled = 
            maxSelectable !== undefined && 
            selectedValues.length >= maxSelectable && 
            !selectedValues.includes(option.value);

          return (
            <div key={option.value} className={`flex items-center ${isDisabled ? 'opacity-70' : ''}`}>
              <input
                id={`${id}-${option.value}`}
                name={`${id}-${option.value}`}
                type="checkbox"
                value={option.value}
                checked={selectedValues.includes(option.value)}
                onChange={() => handleChange(option.value)}
                disabled={isDisabled}
                className={`h-4 w-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500 ${isDisabled ? 'cursor-not-allowed' : ''}`}
              />
              <label 
                htmlFor={`${id}-${option.value}`} 
                className={`ml-2 block text-sm text-slate-700 ${isDisabled ? 'cursor-not-allowed text-slate-500' : ''}`}
              >
                {option.label}
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
};

export default CheckboxGroup;
