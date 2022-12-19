import React from 'react';
import { cva } from 'class-variance-authority';

const CategorySelect = ({ categories, selectedTag, onSelect, locale }) => {
  return (
    <div className="space-y-4 py-2">
      {categories.map(category => (
        <button
          type="button"
          key={category.label}
          className={cva(
            [
              `flex w-full items-center justify-between rounded-lg border-2 px-4 py-2 transition-colors hover:bg-${category.color.name}-50 hover:bg-opacity-50	`,
            ],
            {
              variants: {
                selected: {
                  true: `border-${category.color.name}-500`,
                  false: `border-transparent hover:border-${category.color.name}-500`,
                },
              },
            },
          )({ selected: category.tag === selectedTag })}
          onClick={() => {
            onSelect(category);
          }}
        >
          <span className="font-medium text-gray-800">{category.label}</span>{' '}
          <span className="text-sm">{category.count.toLocaleString(locale)}</span>
        </button>
      ))}
    </div>
  );
};

export default CategorySelect;
