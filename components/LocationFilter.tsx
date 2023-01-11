import React, { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ChevronDown } from '@styled-icons/fa-solid/ChevronDown';
import { ChevronUp } from '@styled-icons/fa-solid/ChevronUp';

import FilterButton from './FilterButton';
import { CloseIcon, LocationPin } from './Icons';

export const LocationFilter = ({ locationOptions, currentCategoryColor, filter, setLocationFilter }) => {
  const [open, setOpen] = useState(false);
  const selectedOption = locationOptions.find(
    option => option.value === filter.location.value && option.type === filter.location.type,
  );
  return (
    <React.Fragment>
      <FilterButton
        label="Location"
        icon={<LocationPin />}
        onClick={() => setOpen(true)}
        currentCategoryColor={currentCategoryColor}
        selectedOption={selectedOption}
      />
      {open && (
        <LocationFilterModal
          open={open}
          handleClose={() => setOpen(false)}
          options={locationOptions}
          setLocationFilter={setLocationFilter}
          filter={filter}
        />
      )}
    </React.Fragment>
  );
};

const LocationFilterModal = ({ open, handleClose, options, filter, setLocationFilter }) => {
  const [activeFilter, setActiveFilter] = useState<{ region?: string; country?: string; city?: string }>({
    region: filter?.location?.type === 'region' ? filter?.location?.value : undefined,
    country: filter?.location?.type === 'country' ? filter?.location?.value : undefined,
    city: filter?.location?.type === 'city' ? filter?.location?.value : undefined,
  });

  const [query, setQuery] = useState('');
  const filteredOptions = {
    regions: options
      .filter(option => option.type === 'region')
      .filter(option =>
        option.label.toLowerCase().replace(/\s+/g, '').includes(query.toLowerCase().replace(/\s+/g, '')),
      ),
    countries: options
      .filter(option => option.type === 'country')
      .filter(option => !activeFilter.region || activeFilter.region === option.region)
      .filter(option =>
        option.label.toLowerCase().replace(/\s+/g, '').includes(query.toLowerCase().replace(/\s+/g, '')),
      ),
    cities: options
      .filter(option => option.type === 'city')
      .filter(option => !activeFilter.region || activeFilter.region === option.region)
      .filter(option => !activeFilter.country || activeFilter.country === option.country)
      .filter(option =>
        option.label.toLowerCase().replace(/\s+/g, '').includes(query.toLowerCase().replace(/\s+/g, '')),
      ),
  };

  const applyFilter = () => {
    const locationFilter = {
      type: activeFilter.city ? 'city' : activeFilter.country ? 'country' : activeFilter.region ? 'region' : null,
      value: activeFilter.city || activeFilter.country || activeFilter.region || null,
    };

    setLocationFilter(locationFilter);
    handleClose();
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-30" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full flex-col items-center justify-center p-4 text-center lg:p-12">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="flex max-h-[770px] w-full max-w-sm flex-1 transform flex-col overflow-hidden rounded-2xl bg-white py-4 text-left align-middle shadow-xl transition-all lg:py-6">
                <div className="relative z-50 flex  flex-1 flex-col overflow-hidden">
                  <div className="flex items-center justify-between border-b px-6 pb-2 lg:px-8">
                    <input
                      className={`z-20 flex w-full items-center justify-between rounded-lg border-2 border-transparent py-2 text-lg text-gray-800 transition-colors	focus:outline-none`}
                      placeholder={'Filter location...'}
                      onChange={event => {
                        setQuery(event.target.value);
                        setActiveFilter({});
                      }}
                      value={query}
                      // eslint-disable-next-line jsx-a11y/no-autofocus
                      autoFocus
                    />
                    <button
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border text-gray-600 hover:bg-gray-50"
                      onClick={handleClose}
                    >
                      <CloseIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="relative flex-1">
                    <div className="absolute inset-0 flex flex-col overflow-hidden">
                      {!!filteredOptions.regions.length && (
                        <LocationSection
                          grow={0}
                          label="Regions"
                          field="region"
                          options={filteredOptions.regions}
                          onSelect={setActiveFilter}
                          activeFilter={activeFilter}
                          filter={filter}
                        />
                      )}
                      {!!filteredOptions.countries.length && (
                        <LocationSection
                          grow={1}
                          label="Countries"
                          field="country"
                          options={filteredOptions.countries}
                          onSelect={setActiveFilter}
                          activeFilter={activeFilter}
                          filter={filter}
                        />
                      )}
                      {!!filteredOptions.cities.length && (
                        <LocationSection
                          grow={1}
                          label="Cities"
                          field="city"
                          options={filteredOptions.cities}
                          onSelect={setActiveFilter}
                          activeFilter={activeFilter}
                          filter={filter}
                        />
                      )}
                    </div>
                  </div>
                  <div className="px-6 pt-4 lg:px-8">
                    <button
                      onClick={applyFilter}
                      className="w-full rounded-full bg-[#1761EB] p-2 text-lg font-medium text-white"
                    >
                      Apply filter
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

const LocationSection = ({ label, options, onSelect, activeFilter, grow, filter, field }) => {
  const [expanded, setExpanded] = useState(
    !filter.location.value || filter.location.type === field || filter.location.type === 'region',
  );

  return (
    <React.Fragment>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full flex-shrink-0 items-center justify-between border-b px-6 py-2 text-left font-medium text-gray-700 hover:bg-gray-50 lg:px-8"
      >
        <span>{label}</span>{' '}
        <div className="flex w-8 justify-center">
          {expanded ? (
            <ChevronUp size="16" className=" text-gray-500" />
          ) : (
            <ChevronDown size="16" className=" text-gray-500" />
          )}
        </div>
      </button>
      {expanded && (
        <div
          style={{ flexGrow: grow }}
          className="flex h-[160px] shrink flex-col overflow-y-scroll border-b px-6 py-2 lg:px-8"
        >
          <div>
            {options.map(option => {
              return (
                <LocationOption key={option.value} onSelect={onSelect} activeFilter={activeFilter} option={option} />
              );
            })}
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

const LocationOption = ({ option, onSelect, activeFilter }) => {
  const ref = React.useRef(null);

  // scroll active option into view when opening the modal
  React.useEffect(() => {
    if (active) {
      setTimeout(() => {
        ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
  }, []);

  const active = activeFilter && activeFilter[option.type] === option.value;

  let filtersToKeep = {};
  if (option.type === 'region') {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { city, country, region, ...rest } = activeFilter;
    filtersToKeep = rest;
  } else if (option.type === 'country') {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { city, country, ...rest } = activeFilter;
    filtersToKeep = rest;
  } else if (option.type === 'city') {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { city, ...rest } = activeFilter;
    filtersToKeep = rest;
  }

  return (
    <button
      ref={ref}
      onClick={() => onSelect({ ...filtersToKeep, ...(!active && { [option.type]: option.value }) })}
      className="flex w-full items-center gap-2 py-0.5 text-left"
    >
      <div className={`h-4 w-4 rounded border ${active ? 'border-[#1761EB] bg-[#1761EB]' : 'bg-white'}`}></div>
      <div className="flex flex-1 items-center justify-between overflow-hidden">
        <span className="overflow-ellipsis whitespace-nowrap">{option.label}</span>{' '}
        <span className="w-8 flex-shrink-0 text-center text-sm text-gray-500">{option.count}</span>
      </div>
    </button>
  );
};
