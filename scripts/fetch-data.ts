import fs from 'fs';
import path from 'path';

import dayjs from 'dayjs';
import dayjsPluginIsoWeek from 'dayjs/plugin/isoWeek';
import dayjsPluginUTC from 'dayjs/plugin/utc';
import dotenv from 'dotenv';
import nodeFetch from 'node-fetch';

import { hosts } from '../lib/hosts';
import getLocation from '../lib/location/getLocation';

// Load environment
// eslint-disable-next-line no-process-env
for (const env of ['local', process.env.NODE_ENV || 'development']) {
  const envPath = path.join(__dirname, '..', `.env.${env}`);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

import { initializeApollo } from '../lib/apollo-client';
import { accountsQuery } from '../lib/graphql/queries';

dayjs.extend(dayjsPluginUTC);
dayjs.extend(dayjsPluginIsoWeek);

const apolloClient = initializeApollo({ fetch: nodeFetch });

const getTotalStats = stats => {
  const raisedSeries = stats.totalNetAmountReceivedTimeSeries.nodes.map(node => ({
    date: node.date,
    amount: node.amount.valueInCents,
  }));
  const raised = raisedSeries.reduce((acc, node) => acc + node.amount, 0);
  const spent = Math.abs(stats.totalAmountSpent.valueInCents);
  const percent = (spent / raised) * 100;

  return {
    contributors: stats.contributorsCount,
    contributions: stats.contributionsCount,
    spent,
    raised,
    percent,
    raisedSeries,
  };
};

const getStats = collective => {
  const stats = {
    ALL: getTotalStats(collective.ALL_stats),
    PAST_YEAR: getTotalStats(collective.PAST_YEAR_stats),
    PAST_QUARTER: getTotalStats(collective.PAST_QUARTER_stats),
  };
  return stats.ALL.raised !== 0 ? stats : null;
};

async function graphqlRequest(query, variables: any = {}) {
  let data;
  // retry fetch 5 times

  for (let i = 0; i <= 5; i++) {
    try {
      if (i === 0) {
        ({ data } = await apolloClient.query({
          query,
          variables,
        }));
      } else {
        console.log('Retrying with half limit, attempt', i, 'of 5');
        const halfLimit = Math.floor(variables.limit / 2);
        const { data: dataFirst } = await apolloClient.query({
          query,
          variables: { ...variables, offset: variables.offset, limit: halfLimit },
        });
        console.log('first half success');
        const { data: dataSecond } = await apolloClient.query({
          query,
          variables: { ...variables, offset: variables.offset + halfLimit, limit: variables.limit - halfLimit },
        });
        console.log('second half success');
        data = {
          accounts: {
            nodes: [...dataFirst.accounts.nodes, ...dataSecond.accounts.nodes],
            totalCount: dataFirst.accounts.totalCount,
            limit: dataFirst.accounts.limit + dataSecond.accounts.limit,
            offset: dataFirst.accounts.offset,
          },
        };
      }

      if (data) {
        break;
      }
    } catch (error) {
      console.error('Error while fetching data', error);
    }
  }

  if (!data) {
    throw new Error('Failed to fetch data');
  }

  return data;
}

async function getDataForHost(host) {
  const { slug, currency } = host;
  const quarterAgo = dayjs.utc().subtract(12, 'week').startOf('isoWeek').toISOString();
  const yearAgo = dayjs.utc().subtract(12, 'month').startOf('month').toISOString();

  const variables = {
    ...(slug !== '' ? { host: { slug } } : { host: host.hostSlugs.map(slug => ({ slug })) }),
    currency,
    quarterAgo,
    yearAgo,
    offset: 0,
    limit: 250,
  };

  let data = await graphqlRequest(accountsQuery, variables);

  if (data.accounts.totalCount > data.accounts.limit) {
    let nodes = [...data.accounts.nodes];
    do {
      variables.offset += data.accounts.limit;
      console.log(`Paginating with offset ${variables.offset}`);
      const startTime = Date.now();
      data = await graphqlRequest(accountsQuery, variables);
      const endTime = Date.now();
      console.log(`Fetched in ${(endTime - startTime) / 1000} s`);
      nodes = [...nodes, ...data.accounts.nodes];
    } while (data.accounts.totalCount > data.accounts.limit + data.accounts.offset);

    data = {
      accounts: {
        ...data.accounts,
        offset: 0,
        limit: data.accounts.totalCount,
        nodes,
      },
    };
  }

  if (data) {
    const collectives = data.accounts.nodes.map(collective => {
      const stats = getStats(collective);
      return {
        name: collective.name,
        slug: collective.slug,
        description: collective.description,
        imageUrl: collective.imageUrl.replace('-staging', ''),
        location: getLocation(collective),
        tags: collective.tags,
        createdAt: collective.createdAt,
        ...(stats && { stats }),
      };
    });
    const directory = path.join(__dirname, '..', '_dump');
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory);
    }

    const filename = path.join(directory, `${host.slug === '' ? 'ALL' : host.slug}.json`);
    console.log('Writing to file', filename);
    fs.writeFile(filename, JSON.stringify({ collectives }, null, 2), error => {
      if (error) {
        throw error;
      }
    });
  }
}

async function run() {
  for (const host of hosts) {
    console.log('Get data for', host);
    await getDataForHost(host);
  }
}

run();
