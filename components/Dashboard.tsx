import React, { Fragment, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

import Chart from './Chart';
import CollectiveModal from './CollectiveModal';
import FilterArea from './FilterArea';
import HostSwitcher from './HostSwitcher';
import Stats from './Stats';
import Stories from './Stories';
import Table from './Table';
import Updates from './Updates';

const getParam = param => (Array.isArray(param) ? param[0] : param);

export default function Dashboard({ categories, collectivesData, stories, locale, host, hosts }) {
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

  const currentCategory = categories.find(category => (currentTag ? category.tag === currentTag : !category.tag));
  const { collectiveCount, totalRaised, numberOfContributions, collectives } =
    currentCategory?.data[currentTimePeriod] || {};
  const totalCollectiveCount = categories[0].data.ALL.collectiveCount;
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col space-y-6 p-4 lg:space-y-10 lg:p-10">
      <HostSwitcher host={host} hosts={hosts} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 lg:gap-10">
        <div className="w-full rounded-lg bg-transparent py-2 px-0 lg:col-span-3 lg:bg-white lg:py-12 lg:px-12">
          <h1 className="text-[28px] font-bold leading-tight text-[#111827] lg:text-[40px]">
            Discover {totalCollectiveCount.toLocaleString(locale)} collectives making an impact
            {categories.length > 1 && (
              <Fragment>
                {' '}
                in{' '}
                {categories
                  .filter(c => c.tag !== 'ALL')
                  .map((cat, i, arr) => (
                    <React.Fragment key={cat.label}>
                      <span className={`whitespace-nowrap underline underline-offset-4 decoration-${cat.tw}-500`}>
                        {cat.label.toLowerCase()}
                      </span>
                      {arr.length - 1 === i ? '' : ', '}
                    </React.Fragment>
                  ))}{' '}
                and more
              </Fragment>
            )}
            .
          </h1>
        </div>
        <div className="hidden rounded-lg bg-white lg:block">
          <div
            className={`flex flex-col items-center justify-center rounded-lg  bg-${host.color}-500 bg-opacity-5 p-4 text-lg lg:p-10`}
          >
            <p className={`hidden font-medium lg:block text-${host.color}-800`}>
              {host.cta?.text ?? `Learn more about ${host.name}`}
            </p>
            <a
              href={host.cta?.buttonHref ?? host.website}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-3 block w-full rounded-full bg-${host.color}-700 px-3 py-2 text-center text-base font-medium text-white lg:text-lg`}
            >
              {host.cta?.buttonLabel ?? 'Learn more'}
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-4 lg:gap-10">
        <div className="sticky top-4 z-20 lg:top-10">
          <FilterArea
            currentTimePeriod={currentTimePeriod}
            currentTag={currentTag}
            categories={categories}
            collectives={collectives}
            currentLocationFilter={currentLocationFilter}
            setCurrentLocationFilter={setCurrentLocationFilter}
            hideFilters={hideFilters}
          />
        </div>
        <div className="space-y-12 lg:col-span-3">
          <div className="-mx-4 space-y-5 rounded-lg bg-white py-4 lg:mx-0 lg:py-8" ref={collectivesDataContainer}>
            <Stats
              totalRaised={totalRaised}
              collectiveCount={collectiveCount}
              numberOfContributions={numberOfContributions}
              locale={locale}
            />
            <div className="lg:px-4">
              <Chart
                startYear={2015}
                currentTag={currentTag}
                currentTimePeriod={currentTimePeriod}
                type={'amount'}
                timeSeriesArray={categories
                  .filter(category => (currentTag === 'ALL' ? true : category.tag === currentTag))
                  .map(category => ({
                    ...category.data[currentTimePeriod].totalReceivedTimeSeries,
                    label: category.label,
                    color: category.color,
                  }))}
                hostSlug={host.slug}
              />
            </div>
            <Table
              collectives={collectives}
              currentTimePeriod={currentTimePeriod}
              currentTag={currentTag}
              currentLocationFilter={currentLocationFilter}
              locale={locale}
              openCollectiveModal={openCollectiveModal}
              hostSlug={host.slug}
            />
          </div>
          <Stories stories={stories} currentTag={currentTag} />
          <Updates host={host} currentTag={currentTag} openCollectiveModal={openCollectiveModal} />
        </div>
      </div>
      {host.cta && (
        <div
          className={`order my-12 grid grid-cols-1 rounded-lg border-2 border-${host.color}-500 bg-${host.color}-500 bg-opacity-5 lg:grid-cols-4 lg:gap-12`}
        >
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
            <h3 className="text-2xl font-bold text-teal-800 lg:text-3xl">{host.cta.text}</h3>
            <div className="flex justify-end"> </div>
          </div>
        </div>
      )}

      <CollectiveModal isOpen={isModalOpen} collective={collectiveInModal} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
