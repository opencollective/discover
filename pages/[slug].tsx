import fs from 'fs';

import React from 'react';
import { gql } from '@apollo/client';
import dayjs from 'dayjs';
import type { GetStaticProps } from 'next';
import Head from 'next/head';

import { initializeApollo } from '../lib/apollo-client';
import { getDataDump } from '../lib/getDataDump';
import getLocation from '../lib/location/getLocation';
import { getAllPosts, markdownToHtml } from '../lib/markdown';

import Dashboard from '../components/Dashboard';
import Layout from '../components/Layout';

export const accountsQuery = gql`
  query SearchAccounts($hostSlug: String, $tag: [String], $dateFrom: DateTime, $dateTo: DateTime, $timeUnit: TimeUnit) {
    accounts(type: [COLLECTIVE, FUND], tag: $tag, tagSearchOperator: OR, limit: 4000, host: { slug: $hostSlug }) {
      totalCount
      nodes {
        id
        name
        slug
        createdAt
        description
        imageUrl(height: 100, format: png)
        tags
        childrenAccounts {
          totalCount
        }
        admins: members(role: ADMIN) {
          totalCount
        }
        contributors: members(role: BACKER) {
          totalCount
        }
        expenses: transactions(limit: 0, type: DEBIT, dateFrom: $dateFrom, dateTo: $dateTo, hasExpense: true) {
          totalCount
        }
        stats {
          id

          balance(dateFrom: $dateFrom, dateTo: $dateTo) {
            valueInCents
            currency
          }
          totalNetAmountReceived(dateFrom: $dateFrom, dateTo: $dateTo) {
            valueInCents
            currency
          }
        }
      }
      stats {
        transactionsTimeSeries(
          dateFrom: $dateFrom
          dateTo: $dateTo
          timeUnit: $timeUnit
          type: CREDIT
          kind: [CONTRIBUTION, ADDED_FUNDS]
          includeChildren: true
        ) {
          timeUnit
          nodes {
            date
            count
            amount {
              value
              valueInCents
              currency
            }
          }
        }
      }
    }
  }
`;

const colors = [
  { tw: 'red', color: '#EF4444' },
  { tw: 'orange', color: '#F97316' },
  { tw: 'amber', color: '#F59E0B' },
  { tw: 'yellow', color: '#EAB308' },
  { tw: 'lime', color: '#84CC16' },
  { tw: 'green', color: '#22C55E' },
  { tw: 'emerald', color: '#10B981' },
  { tw: 'teal', color: '#14B8A6' },
  { tw: 'cyan', color: '#06B6D4' },
  { tw: 'light-blue', color: '#0EA5E9' },
  { tw: 'blue', color: '#3B82F6' },
  { tw: 'indigo', color: '#6366F1' },
  { tw: 'violet', color: '#8B5CF6' },
  { tw: 'purple', color: '#A855F7' },
  { tw: 'fuchsia', color: '#D946EF' },
  { tw: 'pink', color: '#EC4899' },
  { tw: 'rose', color: '#F43F5E' },
];

const pickColorForCategory = (startColor: string, i: number, numOfCategories: number) => {
  const startColorIndex = colors.findIndex(c => c.tw === startColor);
  const step = Math.floor(colors.length / numOfCategories);
  return colors[(startColorIndex + i * step) % colors.length];
};

export const hosts = [
  {
    name: 'Open Collective Foundation',
    slug: 'foundation',
    logoSrc: '/ocf-logo.svg',
    color: 'teal',
    cta: {
      text: 'Contribute to a pooled fund to benefit multiple collectives within Open Collective Foundation',
      buttonLabel: 'Contribute',
      buttonHref: 'https://opencollective.com/solidarity-economy-fund',
    },
    categories: [
      { label: 'All Categories', tag: 'ALL' },
      { label: 'Mutual aid', tag: 'mutual aid' },
      { label: 'Civic Tech', tag: 'civic tech' },
      { label: 'Arts & Culture', tag: 'arts and culture' },
      {
        label: 'Climate',
        tag: 'climate',
        extraTags: ['climate change', 'climate justice'],
      },
    ],
  },
  {
    name: 'Open Source Collective',
    slug: 'opensource',
    logoSrc: '/osc-logo.svg',
    website: 'https://opencollective.com/opensource',
    color: 'purple',
    startYear: 2016,
    categories: [
      { label: 'All Categories', tag: 'ALL' },
      //{ label: 'Open source', tag: 'open source', extraTags: ['opensource'] },
      //{ label: 'Javascript', tag: 'javascript', extraTags: ['nodejs', 'typescript'] },
      //{ label: 'React', tag: 'react' },
      //{ label: 'Python', tag: 'python' },
      //{ label: 'PHP', tag: 'php' },
    ],
  },
  {
    name: 'Open Collective Europe',
    slug: 'europe',
    logoSrc: '/oce-logo.svg',
    color: 'yellow',
    categories: [{ label: 'All Categories', tag: 'ALL' }],
  },
];

export const simpleDateToISOString = (date, isEndOfDay, timezoneType) => {
  if (!date) {
    return null;
  } else {
    const isUTC = timezoneType === 'UTC';
    const dayjsTimeMethod = isEndOfDay ? 'endOf' : 'startOf';
    const result = isUTC ? dayjs.utc(date) : dayjs(date);
    return result[dayjsTimeMethod]('day').toISOString();
  }
};

const getTimeVariables = (
  period: 'ALL' | 'PAST_YEAR' | 'PAST_QUARTER',
): { dateTo: string; dateFrom: string; timeUnit: 'WEEK' | 'MONTH' | 'YEAR' } => {
  switch (period) {
    case 'PAST_QUARTER':
      return {
        // 12 weeks ago
        dateFrom: dayjs.utc().subtract(12, 'week').startOf('week').toISOString(),
        // today
        dateTo: dayjs.utc().toISOString(),
        timeUnit: 'WEEK',
      };
    case 'PAST_YEAR':
      return {
        // 12 months ago
        dateFrom: dayjs.utc().subtract(12, 'month').startOf('month').toISOString(),
        // today
        dateTo: dayjs.utc().toISOString(),
        timeUnit: 'MONTH',
      };
    case 'ALL':
      return {
        dateFrom: dayjs.utc(`2015-01-01`).startOf('year').toISOString(),
        dateTo: dayjs.utc().endOf('year').toISOString(),
        timeUnit: 'YEAR',
      };
  }
};

// year by year average currency conversion rate between EUR and USD
// https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/eurofxref-graph-usd.en.html
const EUR_TO_USD_CONVERSION_RATES = {
  2017: 1.1297,
  2018: 1.181,
  2019: 1.1195,
  2020: 1.1422,
  2021: 1.1827,
  2022: 1.0527,
};

//https://www.ofx.com/en-ie/forex-news/historical-exchange-rates/gbp/usd/
const GBP_TO_USD_CONVERSION_RATES = {
  2015: 1.528504,
  2016: 1.355673,
  2017: 1.288611,
  2018: 1.334801,
  2019: 1.276933,
  2020: 1.284145,
  2021: 1.375083,
  2022: 1.239608,
};

const CAD_TO_USD_CONVERSION_RATES = {
  2015: 0.782992,
  2016: 0.755107,
  2017: 0.771282,
  2018: 0.771588,
  2019: 0.753598,
  2020: 0.74652,
  2021: 0.797833,
  2022: 0.772785,
};

const INR_TO_USD_CONVERSION_RATES = {
  2015: 0.782992,
  2016: 0.755107,
  2017: 0.771282,
  2018: 0.771588,
  2019: 0.753598,
  2020: 0.74652,
  2021: 0.797833,
  2022: 0.772785,
};

const convertCurrency = (amount, fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) {
    return amount;
  } else if (fromCurrency === 'EUR' && toCurrency === 'USD') {
    const year = dayjs.utc(amount.date).year();
    const conversionRate = EUR_TO_USD_CONVERSION_RATES[year];
    return amount * conversionRate;
  } else if (fromCurrency === 'USD' && toCurrency === 'EUR') {
    const year = dayjs.utc(amount.date).year();
    const conversionRate = EUR_TO_USD_CONVERSION_RATES[year];

    return amount / conversionRate;
  } else if (fromCurrency === 'GBP' && toCurrency === 'USD') {
    const year = dayjs.utc(amount.date).year();
    const conversionRate = GBP_TO_USD_CONVERSION_RATES[year];
    return amount * conversionRate;
  } else if (fromCurrency === 'CAD' && toCurrency === 'USD') {
    const year = dayjs.utc(amount.date).year();
    const conversionRate = CAD_TO_USD_CONVERSION_RATES[year];
    return amount * conversionRate;
  } else if (fromCurrency === 'INR' && toCurrency === 'USD') {
    const year = dayjs.utc(amount.date).year();
    const conversionRate = INR_TO_USD_CONVERSION_RATES[year];
    return amount * conversionRate;
  } else {
    throw new Error(`Unsupported currency conversion: ${fromCurrency} -> ${toCurrency}`);
  }
};

const getDataForTagAndPeriod = async ({ apollo, hostSlug, category, period }) => {
  const { dateFrom, dateTo, timeUnit } = getTimeVariables(period);
  const { tag, extraTags = [] } = category;
  let data = getDataDump(hostSlug, tag, period);

  if (!data) {
    ({ data } = await apollo.query({
      query: accountsQuery,
      variables: {
        hostSlug,
        dateFrom,
        dateTo,
        timeUnit,
        ...(tag !== 'ALL' && { tag: [tag, ...extraTags] }),
      },
    }));

    // eslint-disable-next-line no-process-env
    if (data && process.env.NODE_ENV === 'development') {
      fs.writeFile(`_dump/${hostSlug}/${tag}-${period}.json`, JSON.stringify(data), error => {
        if (error) {
          throw error;
        }
      });
    }
  }

  const totalRaisedAmount = data.accounts.stats.transactionsTimeSeries.nodes.reduce(
    (acc, node) => {
      if (acc.currency && acc.currency !== node.amount.currency) {
        const convertedAmount = Math.round(
          convertCurrency(node.amount.valueInCents, node.amount.currency, acc.currency),
        );
        return { valueInCents: acc.valueInCents + convertedAmount, currency: acc.currency };
      }
      return {
        valueInCents: acc.valueInCents + node.amount.valueInCents,
        currency: node.amount.currency,
      };
    },
    { valueInCents: 0, currency: null },
  );

  const totalContributionsCount = data.accounts.stats.transactionsTimeSeries.nodes.reduce((acc, node) => {
    return acc + node.count;
  }, 0);

  return {
    collectiveCount: data.accounts.totalCount,
    totalRaised: totalRaisedAmount,
    numberOfContributions: totalContributionsCount,
    totalReceivedTimeSeries: data.accounts.stats.transactionsTimeSeries,
    contributionsCountTimeSeries: data.accounts.stats.transactionsTimeSeries,
    dateFrom,
    dateTo,
    collectives: data.accounts.nodes.map(collective => {
      const totalDisbursed =
        collective.stats.totalNetAmountReceived.valueInCents - collective.stats.balance.valueInCents;
      const percentDisbursed = (totalDisbursed / collective.stats.totalNetAmountReceived.valueInCents) * 100;
      return {
        id: collective.id,
        name: collective.name,
        slug: collective.slug,
        description: collective.description,
        imageUrl: collective.imageUrl.replace('-staging', ''),
        location: getLocation(collective),
        totalRaised: collective.stats.totalNetAmountReceived.valueInCents,
        totalDisbursed,
        percentDisbursed,
        currency: collective.stats.totalNetAmountReceived.currency,
        subCollectivesCount: collective.childrenAccounts.totalCount,
        adminCount: collective.admins.totalCount,
        contributorsCount: collective.contributors.totalCount,
        expensesCount: collective.expenses.totalCount,
        createdAt: collective.createdAt,
        tags: collective.tags,
      };
    }),
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const hostSlug: string = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const apollo = initializeApollo();
  const host = hosts.find(h => h.slug === hostSlug);
  const categoriesWithData = await Promise.all(
    host.categories.map(async (category, i, arr) => {
      const { color, tw } = pickColorForCategory(host.color, i, arr.length);

      return {
        ...category,
        color,
        tw,
        data: {
          ALL: await getDataForTagAndPeriod({ apollo, hostSlug, category, period: 'ALL' }),
          PAST_YEAR: await getDataForTagAndPeriod({ apollo, hostSlug, category, period: 'PAST_YEAR' }),
          PAST_QUARTER: await getDataForTagAndPeriod({ apollo, hostSlug, category, period: 'PAST_QUARTER' }),
        },
      };
    }),
  );

  const collectivesAllData = categoriesWithData.find(c => c.tag === 'ALL').data.ALL.collectives;

  const collectivesData = collectivesAllData.reduce((acc, collective) => {
    acc[collective.slug] = collective;
    return acc;
  }, {});

  const allStories = getAllPosts(hostSlug, ['title', 'content', 'tags', 'location', 'slug', 'video']);
  // run markdownToHtml on content in stories

  const storiesWithContent = await Promise.all(
    allStories.map(async story => {
      return {
        ...story,
        tags: story.tags.map(tag => ({ color: categoriesWithData.find(c => c.tag === tag)?.color ?? null, tag: tag })),
        content: await markdownToHtml(story.content),
      };
    }),
  );

  return {
    props: {
      host: hosts.find(h => h.slug === hostSlug),
      hosts,
      categories: categoriesWithData,
      collectivesData,
      stories: storiesWithContent,
    },
    revalidate: 60 * 60 * 24, // Revalidate the static page at most once every 24 hours to not overload the API
  };
};

export async function getStaticPaths() {
  return {
    paths: [{ params: { slug: 'foundation' } }, { params: { slug: 'opensource' } }, { params: { slug: 'europe' } }],
    fallback: false,
  };
}

export default function Page({ categories, collectivesData, stories, host, hosts }) {
  const locale = 'en';
  return (
    <Layout>
      <Head>
        <title>Discover {host.name}</title>
      </Head>
      <Dashboard
        categories={categories}
        collectivesData={collectivesData}
        stories={stories}
        locale={locale}
        host={host}
        hosts={hosts}
      />
    </Layout>
  );
}
