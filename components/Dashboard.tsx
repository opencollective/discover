import React, { Fragment } from 'react';
import { useRouter } from 'next/router';
import styled from 'styled-components';

import { formatCurrency } from '@opencollective/frontend-components/lib/currency-utils';

import CategorySelect from '../components/CategorySelect';
import Chart from '../components/Chart';
import Collectives from '../components/Collectives';
import { H1 } from '@opencollective/frontend-components/components/Text';

import DropdownSelector from './Dropdown';

const Metric = styled.div`
  text-align: center;
  &:not(:last-child) {
    border-right: 1px solid #e6e8eb;
  }
  p {
    font-weight: 500;
    font-size: 32px;
    margin: 0 0 12px 0;
  }
  span {
    font-size: 20px;

    margin: 0;
    display: block;
  }
`;

const Flex = styled.div`
  display: flex;
  gap: 32px;
  flex-direction: column;
`;
const Top = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 24px;
  margin-bottom: 16px;
`;
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-gap: 32px;
  margin-top: 16px;
`;

const getParam = param => (Array.isArray(param) ? param[0] : param);

export default function Dashboard({ categories, collectivesData, locale }) {
  const router = useRouter();
  const currentTag = getParam(router.query?.tag) ?? 'ALL';
  const currentTimePeriod = getParam(router.query?.time) ?? 'ALL';
  const currentMetric = getParam(router.query?.metric) ?? 'TOTAL_RAISED';

  const currentCategory = categories.find(category => (currentTag ? category.tag === currentTag : !category.tag));
  const { collectiveCount, totalRaised, numberOfContributions, collectives } =
    currentCategory?.data[currentTimePeriod] || {};

  return (
    <Fragment>
      <div>
        <Top>
          <H1 fontSize="24px" lineHeight="1.5" fontWeight={500}>
            Discover {collectiveCount} collectives in{' '}
            {currentTag !== 'ALL' ? (
              <React.Fragment>
                <span style={{ color: currentCategory.color }}>{currentTag}</span>
              </React.Fragment>
            ) : (
              <React.Fragment>
                {categories
                  .filter(c => c.tag !== 'ALL')
                  .map(category => (
                    <span key={category.tag} style={{ color: category.color }}>
                      {category.label}
                    </span>
                  ))

                  .reduce((prev, curr) => [prev, ', ', curr])}{' '}
                and more
              </React.Fragment>
            )}
          </H1>
          <DropdownSelector
            options={[
              { tag: 'ALL', label: 'all time' },
              { tag: 'PAST_YEAR', label: 'past 12 months' },
              { tag: 'PAST_QUARTER', label: 'past 3 months' },
            ]}
            currentTag={currentTimePeriod}
            onChange={time => {
              router.push({ pathname: '/', query: { ...router.query, ...{ time: time.tag } } }, null, {
                shallow: true,
              });
            }}
          />
        </Top>
        <Flex>
          <CategorySelect
            currentTimePeriod={currentTimePeriod}
            selectedTag={currentTag}
            categories={categories}
            onSelect={category => {
              router.push({ pathname: '/', query: { ...router.query, ...{ tag: category.tag } } }, null, {
                shallow: true,
              });
            }}
          />

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
          >
            <Grid>
              <Metric>
                <p>{formatCurrency(totalRaised.valueInCents, totalRaised.currency, { locale, precision: 0 })}</p>
                <span>total raised</span>
              </Metric>
              <Metric>
                <p>{numberOfContributions.toLocaleString(locale)}</p>
                <span>contributions</span>
              </Metric>
              <Metric>
                <p>{collectiveCount.toLocaleString(locale)}</p>
                <span>collectives</span>
              </Metric>
            </Grid>
          </Chart>
          <Collectives
            collectives={collectives}
            currentMetric={currentMetric}
            currentTimePeriod={currentTimePeriod}
            currentTag={currentTag}
            locale={locale}
            collectivesData={collectivesData}
          />
        </Flex>
      </div>
    </Fragment>
  );
}
