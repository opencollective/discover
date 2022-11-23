import React, { Fragment, useState } from 'react';
import { useRouter } from 'next/router';
import styled from 'styled-components';

import { formatCurrency } from '@opencollective/frontend-components/lib/currency-utils';

import Chart from './Chart';
import FilterArea from './FilterArea';
import Story from './Story';
import Table from './Table';

const Metric = styled.div`
  text-align: center;
  &:not(:last-child) {
    border-right: 1px solid #e6e8eb;
  }
  p {
    font-weight: 500;
    font-size: 28px;
    margin: 0 0 4px 0;
  }
  span {
    font-size: 18px;
    color: #374151;
    margin: 0;
    display: block;
  }
`;

const Flex = styled.div`
  display: flex;
  gap: 32px;
  flex-direction: column;
  padding-bottom: 100px;
  padding: 1rem 1rem 100px 1rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const getParam = param => (Array.isArray(param) ? param[0] : param);

export default function Dashboard({ categories, collectivesData, locale }) {
  const router = useRouter();
  const currentTag = getParam(router.query?.tag) ?? 'ALL';
  const currentTimePeriod = getParam(router.query?.time) ?? 'ALL';

  const [currentLocationFilter, setCurrentLocationFilter] = useState(JSON.stringify({ label: 'All', value: '' }));

  const currentCategory = categories.find(category => (currentTag ? category.tag === currentTag : !category.tag));
  const { collectiveCount, totalRaised, numberOfContributions, collectives } =
    currentCategory?.data[currentTimePeriod] || {};
  const totalCollectiveCount = categories[0].data.ALL.collectiveCount;
  return (
    <Fragment>
      <div>
        <Flex>
          <div className="mt-8 grid grid-cols-3 gap-10">
            <div className="col-span-2  rounded-lg bg-white p-12">
              <h1 className="max-w-[600px] text-5xl font-bold leading-tight text-[#111827]">
                Discover {totalCollectiveCount.toLocaleString(locale)} collectives making an impact in{' '}
                {categories
                  .filter(c => c.tag !== 'ALL')
                  .map((cat, i, arr) => (
                    <React.Fragment key={cat.label}>
                      <span className={`whitespace-nowrap  underline underline-offset-8 `}>
                        {cat.label.toLowerCase()}
                      </span>
                      {arr.length - 1 === i ? '' : ', '}
                    </React.Fragment>
                  ))}{' '}
                and more
              </h1>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg bg-white p-12">
              <div className="flex flex-shrink flex-col items-start justify-start">
                <span className="max-w-[250px] text-4xl font-bold text-[#0C2D66]">
                  out of{' '}
                  <a href="https://opencollective.com/search" target="_blank" className="underline" rel="noreferrer">
                    15,000
                  </a>{' '}
                  collectives operating transparently
                </span>
                <div className="mt-4">
                  <span className="italic text-[#1869F5]">powered by</span>{' '}
                  <img src="/oc-logo.svg" alt="Open Collective" className="ml-2 inline h-8" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-10">
            <div className="space-y-10">
              <div>
                <div className="rounded-lg border-2 border-[#044F54] bg-[#F7FEFF] px-6 py-4">
                  <img src="/ocf-logo.svg" alt="OCF Logotype" className="-ml-2 h-10" />
                  <p className="mt-4 font-medium text-gray-900">
                    Displaying data from {totalCollectiveCount.toLocaleString(locale)} collectives hosted under Open
                    Collective Foundation
                  </p>
                </div>
                <a
                  href="https://opencollective.com/solidarity-economy-fund"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 block w-full rounded-full bg-[#044F54] p-3 text-center text-lg font-medium text-white"
                >
                  Contribute
                </a>
              </div>
              <FilterArea
                currentTimePeriod={currentTimePeriod}
                currentTag={currentTag}
                categories={categories}
                collectives={collectives}
                currentLocationFilter={currentLocationFilter}
                setCurrentLocationFilter={setCurrentLocationFilter}
              />
            </div>
            <div className="col-span-3">
              <div className="rounded-lg bg-white">
                <div className="grid grid-cols-3 p-6 pb-0">
                  <Metric>
                    <p>{collectiveCount.toLocaleString(locale)}</p>
                    <span>Collectives</span>
                  </Metric>
                  <Metric>
                    <p>{formatCurrency(totalRaised.valueInCents, totalRaised.currency, { locale, precision: 0 })}</p>
                    <span>Total raised</span>
                  </Metric>
                  <Metric>
                    <p>{numberOfContributions.toLocaleString(locale)}</p>
                    <span>Contributions</span>
                  </Metric>
                </div>
                <div className="p-4">
                  <Chart
                    startYear={2018}
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
                  />
                </div>
                <Table
                  collectives={collectives}
                  currentTimePeriod={currentTimePeriod}
                  currentTag={currentTag}
                  currentLocationFilter={currentLocationFilter}
                  locale={locale}
                  collectivesData={collectivesData}
                />
              </div>
            </div>
          </div>

          <Story stories={currentCategory.stories} />
        </Flex>
      </div>
    </Fragment>
  );
}
