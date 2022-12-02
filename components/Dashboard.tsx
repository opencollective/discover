import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

import Chart from './Chart';
import CollectiveModal from './CollectiveModal';
import FilterArea from './FilterArea';
import Stats from './Stats';
import Stories from './Stories';
import Table from './Table';
import Updates from './Updates';

const getParam = param => (Array.isArray(param) ? param[0] : param);

function filterLocation(collectives, locationFilter) {
  const filter = JSON.parse(locationFilter);
  if (filter.value === '') {
    return collectives;
  }
  return collectives.filter(collective => {
    const { region, domesticRegion, countryCode } = collective.location;

    if (filter.type === 'region') {
      return region === filter.value;
    } else if (filter.type === 'domesticRegion') {
      return domesticRegion === filter.value;
    } else if (filter.type === 'countryCode') {
      return countryCode === filter.value;
    }
  });
}

export default function Dashboard({ categories, collectives, collectivesData, stories, locale }) {
  const router = useRouter();
  const currentTag = getParam(router.query?.tag) ?? 'ALL';
  const currentTimePeriod = getParam(router.query?.time) ?? 'ALL';

  const [currentLocationFilter, setCurrentLocationFilter] = useState(JSON.stringify({ label: 'All', value: '' }));
  const [collectiveInModal, setCollectiveInModal] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openCollectiveModal = (slug: string) => {
    setCollectiveInModal(collectivesData[slug]);
    setIsModalOpen(true);
  };
  const collectivesDataContainer = useRef(null);
  const [hideFilters, setHideFilters] = useState(false);

  const handleScroll = () => {
    const { bottom } = collectivesDataContainer.current.getBoundingClientRect();
    // hide extra filters only related to collectives data
    if (bottom < 400) {
      setHideFilters(true);
    } else {
      setHideFilters(false);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredCollectives = React.useMemo(
    () => filterLocation(collectives, currentLocationFilter),
    [currentTag, currentLocationFilter],
  );

  const categoriesWithFilteredData = categories.map(category => {
    const collectivesInCategory = filteredCollectives.filter(
      collective => category.tag === 'ALL' || collective.tags?.includes(category.tag),
    );
    return {
      ...category,
      collectives: collectivesInCategory,
    };
  });

  const currentCategory = categoriesWithFilteredData.find(category =>
    currentTag ? category.tag === currentTag : !category.tag,
  );

  // const filteredCollectivesInCurrentCategory = React.useMemo(
  //   () => filterLocation(currentCategory.data.collectives, currentLocationFilter),
  //   [currentTag, currentLocationFilter],
  // );
  console.log({ collectives });
  const stats = React.useMemo(() => {
    return currentCategory.collectives.reduce(
      (acc, collective) => {
        return {
          ALL: {
            totalNetRaised: acc.ALL.totalNetRaised + collective.stats.ALL.totalNetRaised,
            totalContributions: acc.ALL.totalContributions + collective.stats.ALL.contributions,
            totalContributors: acc.ALL.totalContributors + collective.stats.ALL.contributors,
          },
          PAST_YEAR: {
            totalNetRaised: acc.PAST_YEAR.totalNetRaised + collective.stats.PAST_YEAR.totalNetRaised,
            totalContributions: acc.PAST_YEAR.totalContributions + collective.stats.PAST_YEAR.contributions,
            totalContributors: acc.PAST_YEAR.totalContributors + collective.stats.PAST_YEAR.contributors,
          },

          PAST_QUARTER: {
            totalNetRaised: acc.PAST_QUARTER.totalNetRaised + collective.stats.PAST_QUARTER.totalNetRaised,
            totalContributions: acc.PAST_QUARTER.totalContributions + collective.stats.PAST_QUARTER.contributions,
            totalContributors: acc.PAST_QUARTER.totalContributors + collective.stats.PAST_QUARTER.contributors,
          },
        };
      },
      {
        ALL: {
          totalNetRaised: 0,
          totalContributions: 0,
          totalContributors: 0,
        },
        PAST_YEAR: {
          totalNetRaised: 0,
          totalContributions: 0,
          totalContributors: 0,
        },
        PAST_QUARTER: {
          totalNetRaised: 0,
          totalContributions: 0,
          totalContributors: 0,
        },
      },
    );
  }, [currentTag, currentLocationFilter]);

  const totalCollectiveCount = collectives.length;

  const timeSeries = React.useMemo(() => {
    const categories = categoriesWithFilteredData.map(category => {
      const categoryTimeSeries = category.collectives.reduce(
        (acc, node) => {
          // console.log({ acc });
          // if (!acc) {
          //   console.log({ acc });
          // }
          // return acc;
          node.stats.ALL.totalNetRaisedTimeSeries.forEach(timeSeries => {
            const key = timeSeries.date;
            if (!acc.ALL[key]) {
              acc.ALL[key] = {
                date: timeSeries.date,
                amount: { valueInCents: 0, currency: timeSeries.amount.currency },
              };
            }
            acc.ALL[key].amount.valueInCents += timeSeries.amount.valueInCents;
          });
          node.stats.PAST_QUARTER.totalNetRaisedTimeSeries.forEach(timeSeries => {
            const key = timeSeries.date;
            if (!acc.PAST_QUARTER[key]) {
              acc.PAST_QUARTER[key] = {
                date: timeSeries.date,
                amount: { valueInCents: 0, currency: timeSeries.amount.currency },
              };
            }
            acc.PAST_QUARTER[key].amount.valueInCents += timeSeries.amount.valueInCents;
          });
          node.stats.PAST_YEAR.totalNetRaisedTimeSeries.forEach(timeSeries => {
            const key = timeSeries.date;
            if (!acc.PAST_YEAR[key]) {
              acc.PAST_YEAR[key] = {
                date: timeSeries.date,
                amount: { valueInCents: 0, currency: timeSeries.amount.currency },
              };
            }
            acc.PAST_YEAR[key].amount.valueInCents += timeSeries.amount.valueInCents;
          });
          return { ...acc };
        },
        { ALL: {}, PAST_QUARTER: {}, PAST_YEAR: {} },
      );
      console.log({ categoryTimeSeries });

      return {
        ALL: {
          label: category.label,
          color: category.color,
          tag: category.tag,
          timeUnit: 'YEAR',
          nodes: Object.values(categoryTimeSeries.ALL),
        },
        PAST_QUARTER: {
          label: category.label,
          color: category.color,
          tag: category.tag,

          timeUnit: 'WEEK',
          nodes: Object.values(categoryTimeSeries.PAST_QUARTER),
        },
        PAST_YEAR: {
          label: category.label,
          color: category.color,
          tag: category.tag,

          timeUnit: 'MONTH',
          nodes: Object.values(categoryTimeSeries.PAST_YEAR),
        },
      };
    });
    console.log({ categories });
    return categories.reduce(
      (acc, category) => {
        if (!acc) {
          console.log({ accInLastR: acc });
        }
        return {
          ALL: [...acc.ALL, category.ALL],
          PAST_QUARTER: [...acc.PAST_QUARTER, category.PAST_QUARTER],
          PAST_YEAR: [...acc.PAST_YEAR, category.PAST_YEAR],
        };
        // acc.ALL.push(category.ALL);
        // acc.PAST_QUARTER.push(category.PAST_QUARTER);
        // acc.PAST_YEAR.push(category.PAST_YEAR);
      },
      { ALL: [], PAST_QUARTER: [], PAST_YEAR: [] },
    );
  }, [currentTag, currentLocationFilter]);

  console.log({ stats });
  return (
    <div className="mx-auto mt-4 flex max-w-[1400px] flex-col space-y-10 p-4 lg:p-10">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-4">
        <div className="w-full rounded-lg bg-white p-6 lg:col-span-3 lg:p-12">
          <h1 className="text-[28px] font-bold leading-tight text-[#111827] lg:text-[40px]">
            Discover {totalCollectiveCount.toLocaleString(locale)} collectives making an impact in{' '}
            {categories
              .filter(c => c.tag !== 'ALL')
              .map((cat, i, arr) => (
                <React.Fragment key={cat.label}>
                  <span className={`whitespace-nowrap underline underline-offset-4 decoration-${cat.tc}-500`}>
                    {cat.label.toLowerCase()}
                  </span>
                  {arr.length - 1 === i ? '' : ', '}
                </React.Fragment>
              ))}{' '}
            and more.
          </h1>
        </div>
        <div className="flex flex-col items-center justify-center bg-[#F7FEFF]  p-12 lg:rounded-lg">
          <img src="/ocf-logo.svg" alt="OCF Logotype" className="h-10" />
          <a
            href="https://opencollective.com/solidarity-economy-fund"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-10 block w-full rounded-full bg-[#044F54] px-3 py-2.5 text-center text-lg font-medium text-white"
          >
            Contribute
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-4">
        <div className="sticky top-4 z-20 lg:top-10">
          <FilterArea
            currentTimePeriod={currentTimePeriod}
            currentTag={currentTag}
            categories={categoriesWithFilteredData}
            collectives={collectives}
            currentLocationFilter={currentLocationFilter}
            setCurrentLocationFilter={setCurrentLocationFilter}
            hideFilters={hideFilters}
          />
        </div>
        <div className="space-y-12 lg:col-span-3">
          <div className="-mx-4 space-y-5 rounded-lg bg-white py-4 lg:mx-0 lg:py-8" ref={collectivesDataContainer}>
            <Stats
              totalNetRaised={stats[currentTimePeriod].totalNetRaised}
              collectiveCount={currentCategory.collectives.length}
              totalContributions={stats[currentTimePeriod].totalContributions}
              locale={locale}
              totalContributors={stats[currentTimePeriod].totalContributors}
            />
            <div className="lg:px-4">
              <Chart
                startYear={2016}
                currentTag={currentTag}
                currentTimePeriod={currentTimePeriod}
                currentLocationFilter={currentLocationFilter}
                type={'amount'}
                timeSeriesArray={timeSeries[currentTimePeriod].filter(category =>
                  currentTag === 'ALL' ? true : category.tag === currentTag,
                )}
              />
            </div>
            <Table
              collectives={currentCategory.collectives}
              currentTimePeriod={currentTimePeriod}
              currentTag={currentTag}
              currentLocationFilter={currentLocationFilter}
              locale={locale}
              openCollectiveModal={openCollectiveModal}
            />
          </div>
          <Stories stories={stories} currentTag={currentTag} />
          <Updates currentTag={currentTag} openCollectiveModal={openCollectiveModal} />
        </div>
      </div>
      <div>
        <div className="order my-12 grid grid-cols-1 rounded-lg border-2 border-teal-500 bg-[#F7FEFF] lg:grid-cols-4 lg:gap-12">
          <div className="flex flex-col justify-center p-6 pt-0 lg:p-10 lg:pt-10 lg:pr-4 ">
            <a
              href="https://opencollective.com/solidarity-economy-fund"
              target="_blank"
              rel="noopener noreferrer"
              className=" block rounded-full bg-[#044F54] px-3 py-3 text-center text-lg font-medium text-white lg:py-4 lg:text-xl"
            >
              Contribute
            </a>
          </div>
          <div className="order-first p-6 lg:order-last lg:col-span-3 lg:p-10 lg:pl-0">
            <h3 className="text-2xl font-bold text-teal-800 lg:text-3xl">
              Contribute to a pooled fund to benefit multiple collectives within Open Collective Foundation
            </h3>{' '}
            <div className="flex justify-end"> </div>
          </div>
        </div>
      </div>
      <CollectiveModal isOpen={isModalOpen} collective={collectiveInModal} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
