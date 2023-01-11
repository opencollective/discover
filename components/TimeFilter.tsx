import React, { Fragment, useEffect, useRef, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';

import FilterButton from './FilterButton';
import { DateIcon } from './Icons';

const findOptionFromValue = (options, value) => {
  return options.find(option => {
    return option.value === value;
  });
};

export function TimeFilter({
  filter,
  options,
  currentCategoryColor,
  setTimeFilter,
}: {
  options: any;
  filter: any;
  currentCategoryColor: string;
  setTimeFilter: (any) => void;
}) {
  const selectedOption = findOptionFromValue(options, filter.timePeriod);
  const buttonRef = useRef(null);
  return (
    <React.Fragment>
      <Menu as="div" className="relative">
        {({ open }) => (
          <React.Fragment>
            <div>
              <Menu.Button as={React.Fragment}>
                <FilterButton
                  label="Date range "
                  icon={<DateIcon />}
                  currentCategoryColor={currentCategoryColor}
                  selectedOption={selectedOption}
                  ref={buttonRef}
                />
              </Menu.Button>
            </div>
            <MenuContainer open={open} options={options} setTimeFilter={setTimeFilter} buttonRef={buttonRef} />
          </React.Fragment>
        )}
      </Menu>
    </React.Fragment>
  );
}

const MenuContainer = ({ options, setTimeFilter, open, buttonRef }) => {
  const [dropdownPlacement, setDropdownPlacement] = useState('bottom');

  // put dropdown above button if it's too close to the bottom of the screen
  useEffect(() => {
    if (!buttonRef.current) {
      return;
    }
    const { top } = buttonRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const distance = windowHeight - top;
    if (distance < 175) {
      setDropdownPlacement('top');
    } else {
      setDropdownPlacement('bottom');
    }
  }, [open]);

  return (
    <Transition
      as={Fragment}
      enter="transition ease-out duration-100"
      enterFrom="transform opacity-0 scale-95"
      enterTo="transform opacity-100 scale-100"
      leave="transition ease-in duration-75"
      leaveFrom="transform opacity-100 scale-100"
      leaveTo="transform opacity-0 scale-95"
    >
      <Menu.Items
        className={`absolute right-0 ${
          dropdownPlacement === 'bottom' ? 'mt-2' : 'bottom-0 mb-12'
        }  origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none`}
      >
        <div className="p-2 ">
          {options.map(option => {
            return (
              <Menu.Item key={option.value}>
                {({ active }) => (
                  <button
                    onClick={() => setTimeFilter(option.value)}
                    className={`${
                      active ? 'bg-gray-100 ' : ''
                    } group flex w-full items-center justify-end rounded-md px-5 py-2 text-right text-gray-900`}
                  >
                    {option.label}
                  </button>
                )}
              </Menu.Item>
            );
          })}
        </div>
      </Menu.Items>
    </Transition>
  );
};
