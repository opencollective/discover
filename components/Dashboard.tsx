import React, { useRef, useState } from 'react';
import { useRouter } from 'next/router';

import { computeStats, computeTimeSeries } from '../lib/compute-data';
import filterLocation, { LocationFilter } from '../lib/location/filterLocation';
import getFilterOptions from '../lib/location/getFilterOptions';
import { pushFilterToRouter } from '../lib/set-filter';

import Chart from './Chart';
import CollectiveModal from './CollectiveModal';
import FilterArea from './FilterArea';
import HostSwitcher from './HostSwitcher';
import Stats from './Stats';
import Stories from './Stories';
import Table from './Table';
import Updates from './Updates';

export type Filter = {
  slug?: string;
  timePeriod?: string;
  tag?: string;
  location?: LocationFilter;
};

const getParam = param => (Array.isArray(param) ? param[0] : param);

const getLocationFilterParams = query => {
  const location = getParam(query?.location);
  const locationType = getParam(query?.locationType);
  return location && locationType ? { type: locationType, value: location } : null;
};

export default function Dashboard({
  host,
  hosts,
  categories,
  collectives: allCollectives,
  hostSlug,
  stories,
  locale,
  currency,
  startYear,
}) {
  const router = useRouter();
  const filter: Filter = {
    slug: hostSlug,
    timePeriod: getParam(router.query?.time) ?? 'ALL',
    tag: getParam(router.query?.tag) ?? 'ALL',
    location: getLocationFilterParams(router.query) ?? null,
  };

  const locationFilteredCollectives = React.useMemo(
    () => filterLocation(allCollectives, filter.location),
    [JSON.stringify(filter)],
  );

  const categoriesWithFilteredCollectives = React.useMemo(
    () =>
      categories.map(category => {
        return {
          ...category,
          collectives: locationFilteredCollectives.filter(
            collective => category.tag === 'ALL' || collective.tags?.includes(category.tag),
          ),
        };
      }),
    [JSON.stringify(filter)],
  );

  const series = React.useMemo(
    () => computeTimeSeries(categoriesWithFilteredCollectives, filter.timePeriod),
    [JSON.stringify(filter)],
  );

  const currentCatWithCollectives = categoriesWithFilteredCollectives.find(category =>
    filter.tag ? category.tag === filter.tag : category.tag === 'ALL',
  );

  const stats = React.useMemo(
    () => computeStats(currentCatWithCollectives?.collectives, filter.timePeriod),
    [JSON.stringify(filter)],
  );

  const locationOptions = React.useMemo(() => getFilterOptions(allCollectives), [host.slug]);

  const [collectiveInModal, setCollectiveInModal] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openCollectiveModal = (slug: string) => {
    const collective = allCollectives.find(c => c.slug === slug);
    setCollectiveInModal(collective);
    setIsModalOpen(true);
  };

  const collectivesDataContainer = useRef(null);
  const currentCategory = categories.find(category =>
    filter.tag ? category.tag === filter.tag : category.tag === 'ALL',
  );
  const totalCollectiveCount = allCollectives.length;

  const setFilter = (filter: Filter) => pushFilterToRouter(filter, router);

  return (
    <div className="mx-auto mt-2 flex max-w-[1400px] flex-col space-y-6 p-4 lg:space-y-10 lg:p-10">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:gap-10">
        <div className="w-full rounded-lg p-2 lg:col-span-3 lg:bg-white lg:p-12">
          <h1 className="text-[24px] font-bold leading-tight text-[#111827] lg:text-[40px]">
            Discover {totalCollectiveCount.toLocaleString(locale)} collectives {host.slug ? 'hosted by' : 'on'}{' '}
            <HostSwitcher host={host} hosts={hosts} /> making an impact in{' '}
            <span className="">
              {categories
                .filter(c => c.tag !== 'ALL')
                .map((cat, i, arr) => (
                  <React.Fragment key={cat.label}>
                    <span className="whitespace-nowrap">
                      <button
                        className={`inline-block whitespace-nowrap underline underline-offset-4 transition-colors ${
                          filter.tag !== 'ALL' && filter.tag !== cat.tag
                            ? `decoration-transparent hover:decoration-${cat.tw}-500`
                            : `decoration-${cat.tw}-500`
                        }`}
                        onClick={() => setFilter({ tag: cat.tag })}
                      >
                        {cat.label.toLowerCase()}
                      </button>
                      {arr.length - 1 === i ? '' : ','}
                    </span>
                    {` `}
                  </React.Fragment>
                ))}
            </span>
            and more.
          </h1>
        </div>
        <div
          className={`flex-col items-center justify-center px-2 lg:rounded-lg lg:p-10 ${host.styles.brandBox} ${
            !host.cta ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <img src={host.logoSrc} alt={host.name} className="hidden h-8 lg:block" />

          <p className={`my-4 hidden text-center font-medium lg:block`}>
            {host.cta?.text ?? `Learn more about ${host.name}`}
          </p>
          <a
            href={host.cta?.href ?? host.website}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full rounded-full lg:rounded-full ${host.styles.button} px-3 py-3 text-center text-sm font-medium lg:text-lg`}
          >
            <span className="hidden lg:inline-block">{host.cta?.buttonLabel ?? 'Learn more'}</span>
            <span className="inline-block lg:hidden">{host.cta?.text}</span>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-4 lg:gap-10">
        <div className="sticky top-0 z-20 lg:top-10">
          <FilterArea
            filter={filter}
            setFilter={setFilter}
            categories={categories}
            collectivesDataContainerRef={collectivesDataContainer}
            currentCategory={currentCategory}
            locationOptions={locationOptions}
            locale={locale}
          />
        </div>
        <div className="space-y-12 lg:col-span-3">
          <div className="-mx-4 space-y-5 rounded-lg bg-white py-4 lg:mx-0 lg:py-8" ref={collectivesDataContainer}>
            <Stats stats={stats} locale={locale} currency={currency} />
            <div className="lg:px-4">
              <Chart
                startYear={startYear}
                filter={filter}
                timeSeriesArray={series.filter(s => filter.tag === 'ALL' || filter.tag === s.tag)}
                currency={currency}
              />
            </div>
            <Table
              filter={filter}
              setFilter={setFilter}
              collectives={currentCatWithCollectives.collectives}
              locale={locale}
              openCollectiveModal={openCollectiveModal}
              currency={currency}
            />
          </div>
          <Stories stories={stories} filter={filter} openCollectiveModal={openCollectiveModal} />
          <Updates host={host} filter={filter} openCollectiveModal={openCollectiveModal} />
        </div>
      </div>
      {host.cta && (
        <div className="order my-12 grid grid-cols-1 rounded-lg border-2 border-teal-500 bg-[#F7FEFF] lg:grid-cols-4 lg:gap-12">
          <div className="flex flex-col justify-center p-6 pt-0 lg:p-10 lg:pt-10 lg:pr-4 ">
            <a
              href={host.cta.buttonHref}
              target="_blank"
              rel="noopener noreferrer"
              className=" block rounded-full bg-[#044F54] px-3 py-3 text-center text-lg font-medium text-white lg:py-4 lg:text-xl"
            >
              {host.cta.buttonLabel}
            </a>
          </div>
          <div className="order-first p-6 lg:order-last lg:col-span-3 lg:p-10 lg:pl-0">
            <h3 className="text-2xl font-bold text-teal-800 lg:text-3xl">
              Contribute to a pooled fund to benefit multiple collectives within Open Collective Foundation
            </h3>{' '}
            <div className="flex justify-end"> </div>
          </div>
        </div>
      )}

      <CollectiveModal
        isOpen={isModalOpen}
        collective={collectiveInModal}
        onClose={() => setIsModalOpen(false)}
        setFilter={setFilter}
        currency={currency}
      />
    </div>
  );
}
