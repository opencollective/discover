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
  const totalNetAmountReceived = stats.totalNetAmountReceivedTimeSeries.nodes.reduce(
    (acc, node) => {
      return {
        valueInCents: acc.valueInCents + node.amount.valueInCents,
        currency: node.amount.currency,
      };
    },
    { valueInCents: 0 },
  );

  const totalSpent = {
    valueInCents: Math.abs(stats.totalAmountSpent.valueInCents),
    currency: stats.totalAmountSpent.currency,
  };
  const percentDisbursed = (totalSpent.valueInCents / totalNetAmountReceived.valueInCents) * 100;

  return {
    contributors: stats.contributorsCount,
    contributions: stats.contributionsCount,
    totalSpent,
    totalNetRaised: totalNetAmountReceived,
    percentDisbursed,
    totalNetRaisedTimeSeries: stats.totalNetAmountReceivedTimeSeries.nodes,
  };
};

const getStats = collective => {
  const stats = {
    ALL: getTotalStats(collective.ALL_stats),
    PAST_YEAR: getTotalStats(collective.PAST_YEAR_stats),
    PAST_QUARTER: getTotalStats(collective.PAST_QUARTER_stats),
  };
  return stats.ALL.totalNetRaised.valueInCents !== 0 ? stats : null;
};

function graphqlRequest(query, variables = {}) {
  return apolloClient
    .query({
      query,
      variables,
    })
    .then(result => result.data);
}

async function getDataForHost(host) {
  const { slug, currency } = host;
  const quarterAgo = dayjs.utc().subtract(12, 'week').startOf('isoWeek').toISOString();
  const yearAgo = dayjs.utc().subtract(12, 'month').startOf('month').toISOString();

  const variables = { ...(slug !== '' && { host: { slug } }), currency, quarterAgo, yearAgo, offset: 0, limit: 250 };

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
      return {
        id: collective.id,
        name: collective.name,
        slug: collective.slug,
        description: collective.description,
        imageUrl: collective.imageUrl.replace('-staging', ''),
        location: getLocation(collective),
        tags: collective.tags,
        createdAt: collective.createdAt,
        stats: getStats(collective),
      };
    });
    const filename = path.join(__dirname, '..', '_dump', `${host.slug ?? 'ALL'}.json`);
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
