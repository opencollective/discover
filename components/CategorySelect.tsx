import React from 'react';
import { cva } from 'class-variance-authority';

const CategoryButton = ({ category, onClick, selectedTag, currentTimePeriod }) => (
  <button
    type="button"
    key={category.label}
    className={cva(
      [`flex w-full items-center justify-between rounded-lg border-2 px-4 py-2 transition-colors hover:bg-[#FFFEFC]`],
      {
        variants: {
          selected: {
            true: `border-${category.tw}-500`,
            false: `border-transparent hover:border-${category.tw}-500`,
          },
        },
      },
    )({ selected: category.tag === selectedTag })}
    onClick={onClick}
  >
    <span className="font-medium text-gray-800">{category.label}</span>{' '}
    <span className="text-sm">{category.data[currentTimePeriod].collectiveCount}</span>
  </button>
);

const CategorySelect = ({ categories, selectedTag, onSelect, currentTimePeriod }) => {
  return (
    <div className="space-y-4 py-2">
      {categories.map(category => (
        <CategoryButton
          key={category.tag}
          category={category}
          onClick={() => {
            onSelect(category);
          }}
          selectedTag={selectedTag}
          currentTimePeriod={currentTimePeriod}
        />
      ))}
    </div>
  );
};

export default CategorySelect;
