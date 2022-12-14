import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

import { LocationFilter } from '../lib/location/filterLocation';
import { getFilterFromQuery } from '../lib/filter-from-query';

import Chart from './Chart';
import CollectiveModal from './CollectiveModal';
import FilterArea from './FilterArea';
import HostSwitcher from './HostSwitcher';
import Stats from './Stats';
import Stories from './Stories';
import Table from './Table';
import Updates from './Updates';

export type Filter = {
  slug: string;
  tag: string;
  timePeriod: string;
  location: LocationFilter;
};

export default function Dashboard({
  host,
  hosts,
  categories,
  collectives: initialCollectives,
  series: initialSeries,
  stats: initialStats,
  filter: initialFilter,
  stories,
  locale,
  currency,
  locationOptions,
  startYear,
}) {
  const router = useRouter();
  const [{ collectives, series, stats }, setData] = useState({
    collectives: initialCollectives,
    series: initialSeries,
    stats: initialStats,
  });
  const [counter, setCounter] = useState(0);

  const [filter, setFilter] = useState<Filter>(initialFilter);
  // set filter from query params
  useEffect(() => {
    setFilter(getFilterFromQuery(router.query, initialFilter));
  }, [router.query]);

  // fetch data
  useEffect(() => {
    // first render, no need to fetch or reset to initial data
    if (counter !== 0 && JSON.stringify(filter) === JSON.stringify(initialFilter)) {
      setData({ collectives: initialCollectives, series: initialSeries, stats: initialStats });
      setCounter(counter + 1);

      // fetch new data
    } else if (counter === 0 && JSON.stringify(filter) === JSON.stringify(initialFilter)) {
      // wake up the API
      fetch('/api/compute', {
        method: 'POST',
        body: JSON.stringify({ slug: host.slug }),
      }).then(res => res.json());
    } else {
      const startFetchTime = Date.now();
      fetch('/api/compute', {
        method: 'POST',
        body: JSON.stringify(filter),
      })
        .then(res => res.json())
        .then(({ collectives, series, stats, time }) => {
          setData({ collectives, series, stats });
          // setLoading(false);
          const endFetchTime = Date.now();
          console.log({ totalFetch: endFetchTime - startFetchTime, handlerTime: time });
          setCounter(counter + 1);
        });
    }
  }, [JSON.stringify(filter)]);

  const setTag = (value: string) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { slug = '', tag, ...rest } = router.query;
    router.push(
      { pathname: `/${slug ?? ''}`, query: { ...rest, ...(value !== 'ALL' && tag !== value && { tag: value }) } },
      null,
      {
        shallow: true,
      },
    );
  };

  const setTimePeriod = (value: string) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { slug = '', time, ...rest } = router.query;
    router.push(
      {
        pathname: `/${slug ?? ''}`,
        query: { ...rest, ...(value !== 'ALL' && { time: value }) },
      },
      null,
      {
        shallow: true,
      },
    );
  };

  const setLocationFilter = (locationFilter: LocationFilter) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { slug = '', location, locationType, ...rest } = router.query;
    router.push(
      {
        pathname: `/${slug ?? ''}`,
        query: {
          ...rest,
          ...(locationFilter && { location: locationFilter.value, locationType: locationFilter.type }),
        },
      },
      null,
      {
        shallow: true,
      },
    );
  };

  const [collectiveInModal, setCollectiveInModal] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openCollectiveModal = (slug: string) => {
    const collective = initialCollectives.find(c => c.slug === slug);
    setCollectiveInModal(collective);
    setIsModalOpen(true);
  };

  const collectivesDataContainer = useRef(null);
  const currentCategory = categories.find(category => (filter.tag ? category.tag === filter.tag : !category.tag));
  const totalCollectiveCount = initialCollectives.length;

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
                        onClick={() => setTag(cat.tag)}
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
            categories={categories}
            setLocationFilter={setLocationFilter}
            setTimePeriod={setTimePeriod}
            setTag={setTag}
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
                timeSeriesArray={series.filter(category => (filter.tag === 'ALL' ? true : category.tag === filter.tag))}
                currency={currency}
                counter={counter}
              />
            </div>
            <Table
              filter={filter}
              collectives={collectives}
              setLocationFilter={setLocationFilter}
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
        setLocationFilter={setLocationFilter}
        currency={currency}
      />
    </div>
  );
}
