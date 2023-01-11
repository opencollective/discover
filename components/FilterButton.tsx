import React, { forwardRef } from 'react';

import { ChevronUpDown } from './Icons';

interface Props {
  currentCategoryColor: string;
  selectedOption?: any;
  icon: any;
  label: string;
  onClick?: any;
}

const FilterButton: React.ForwardRefRenderFunction<HTMLButtonElement, Props> = (
  { currentCategoryColor, selectedOption, icon, label, onClick },
  ref,
) => {
  return (
    <button
      ref={ref}
      onClick={onClick}
      className={`group flex w-full items-center justify-between gap-2 rounded-lg border-2 bg-opacity-75 py-2 px-3 transition-colors   ${
        selectedOption && selectedOption.value !== 'ALL'
          ? `bg-${currentCategoryColor}-50 border-transparent hover:bg-opacity-100 hover:border-${currentCategoryColor}-100`
          : 'border-transparent bg-white hover:border-gray-100  hover:bg-gray-50 '
      }`}
    >
      <div className="flex items-center gap-2 whitespace-nowrap  font-medium">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-1.5 overflow-hidden whitespace-nowrap">
        <span className="overflow-hidden overflow-ellipsis">{selectedOption?.label ?? 'All locations'}</span>{' '}
        <ChevronUpDown className="-mr-1 -ml-0.5 mt-0.5 h-4 w-4 flex-shrink-0" />
      </div>
    </button>
  );
};

export default forwardRef<HTMLButtonElement, Props>(FilterButton);
