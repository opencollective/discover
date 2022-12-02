import fs from 'fs';

import React from 'react';
import { gql } from '@apollo/client';
import dayjs from 'dayjs';
import type { GetStaticProps } from 'next';
import Head from 'next/head';

import { initializeApollo } from '../lib/apollo-client';
import { getDump } from '../lib/getDataDump';
import getLocation from '../lib/location/getLocation';
import { getAllPosts, markdownToHtml } from '../lib/markdown';

import Dashboard from '../components/Dashboard';
import Layout from '../components/Layout';

export const accountsQuery = gql`
  query SearchAccounts($hostSlug: String, $quarterAgo: DateTime, $yearAgo: DateTime) {
    accounts(type: [COLLECTIVE, FUND], limit: 5000, host: { slug: $hostSlug }) {
      totalCount
      nodes {
        id
        name
        slug
        createdAt
        description
        imageUrl(height: 100, format: png)
        tags
        stats {
          id
          allTimeSeries: transactionsTimeSeries(timeUnit: YEAR, includeChildren: true) {
            timeUnit
            nodes {
              date
              contributors
              count
              totalNetRaised {
                valueInCents
                currency
              }
              totalSpent {
                valueInCents
                currency
              }
            }
          }
          quarterTimeSeries: transactionsTimeSeries(dateFrom: $quarterAgo, timeUnit: WEEK, includeChildren: true) {
            timeUnit
            nodes {
              date
              contributors
              count
              totalNetRaised {
                valueInCents
                currency
              }
              totalSpent {
                valueInCents
                currency
              }
            }
          }
          yearTimeSeries: transactionsTimeSeries(dateFrom: $yearAgo, timeUnit: MONTH, includeChildren: true) {
            timeUnit
            nodes {
              date
              contributors
              count
              totalNetRaised {
                valueInCents
                currency
              }
              totalSpent {
                valueInCents
                currency
              }
            }
          }
        }
      }
    }
  }
`;

export const categories = [
  { label: 'All', tag: 'ALL', color: '#14B8A6', tc: 'teal' },
  { label: 'Mutual aid', tag: 'mutual aid', color: '#3B82F6', tc: 'blue' },
  { label: 'Civic Tech', tag: 'civic tech', color: '#A855F7', tc: 'purple' },
  { label: 'Arts & Culture', tag: 'arts and culture', color: '#F43F5E', tc: 'rose' },
  { label: 'Climate', tag: 'climate', extraTags: ['climate change', 'climate justice'], color: '#F59E0B', tc: 'amber' },
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

const getTotalStats = nodes => {
  const total = nodes.reduce(
    (acc, node) => {
      return {
        totalNetRaised: acc.totalNetRaised + node.totalNetRaised.valueInCents,
        totalSpent: acc.totalSpent + node.totalSpent.valueInCents,
        contributors: acc.contributors + node.contributors,
        contributions: acc.contributions + node.count,
      };
    },
    { totalNetRaised: 0, totalSpent: 0, contributors: 0, contributions: 0 },
  );
  return {
    ...total,
    percentDisbursed: (total.totalSpent / total.totalNetRaised) * 100,
    totalNetRaisedTimeSeries: nodes.map(node => ({
      date: node.date,
      amount: { valueInCents: node.totalNetRaised.valueInCents, currency: node.totalNetRaised.currency },
    })),
  };
};

const getDataForHost = async ({ apollo, hostSlug }) => {
  //const { dateFrom, dateTo, timeUnit } = getTimeVariables(period);
  //const { tag, extraTags = [] } = category;
  let data = getDump(hostSlug);

  if (!data) {
    ({ data } = await apollo.query({
      query: accountsQuery,
      variables: {
        hostSlug,
        quarterAgo: dayjs.utc().subtract(12, 'week').startOf('week').toISOString(),
        yearAgo: dayjs.utc().subtract(12, 'month').startOf('month').toISOString(),
      },
    }));

    // eslint-disable-next-line no-process-env
    if (data && process.env.NODE_ENV === 'development') {
      fs.writeFile(`_dump/${hostSlug}.json`, JSON.stringify(data), error => {
        if (error) {
          throw error;
        }
      });
    }
  }

  const collectives = data.accounts.nodes.map(collective => {
    return {
      id: collective.id,
      name: collective.name,
      slug: collective.slug,
      description: collective.description,
      imageUrl: collective.imageUrl.replace('-staging', ''),
      location: getLocation(collective),
      tags: collective.tags,
      createdAt: collective.createdAt,
      stats: {
        ALL: getTotalStats(collective.stats.allTimeSeries.nodes),
        PAST_YEAR: getTotalStats(collective.stats.yearTimeSeries.nodes),
        PAST_QUARTER: getTotalStats(collective.stats.quarterTimeSeries.nodes),
      },
    };
  });

  return {
    collectives,
  };
};

export const getStaticProps: GetStaticProps = async () => {
  const hostSlug = 'foundation';
  const apollo = initializeApollo();

  const { collectives } = await getDataForHost({ apollo, hostSlug });

  const collectivesData = collectives.reduce((acc, collective) => {
    acc[collective.slug] = collective;
    return acc;
  }, {});

  const allStories = getAllPosts(['title', 'content', 'tags', 'location', 'slug', 'video']);
  // run markdownToHtml on content in stories

  const storiesWithContent = await Promise.all(
    allStories.map(async story => {
      return {
        ...story,
        tags: story.tags.map(tag => ({ color: categories.find(c => c.tag === tag)?.color ?? null, tag: tag })),
        content: await markdownToHtml(story.content),
      };
    }),
  );

  return {
    props: {
      collectives,
      categories,
      collectivesData,
      stories: storiesWithContent,
    },
    revalidate: 60 * 60 * 24, // Revalidate the static page at most once every 24 hours to not overload the API
  };
};

export async function getStaticPaths() {
  return {
    paths: [{ params: { slug: 'foundation' } }],
    fallback: false,
  };
}

export default function Page({ categories, collectivesData, stories, collectives }) {
  const locale = 'en';
  return (
    <Layout>
      <Head>
        <title>Discover Open Collective Foundation</title>
      </Head>
      <Dashboard
        categories={categories}
        collectives={collectives}
        collectivesData={collectivesData}
        stories={stories}
        locale={locale}
      />
    </Layout>
  );
}
