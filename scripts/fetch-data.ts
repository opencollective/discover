import fs from 'fs';
import path from 'path';

import dayjs from 'dayjs';
import dayjsPluginIsoWeek from 'dayjs/plugin/isoWeek';
import dayjsPluginUTC from 'dayjs/plugin/utc';
import dotenv from 'dotenv';
import nodeFetch from 'node-fetch';

import { hosts } from '../lib/hosts';

// Load environment
// eslint-disable-next-line no-process-env
for (const env of ['local', process.env.NODE_ENV || 'development']) {
  const envPath = path.join(__dirname, '..', `.env.${env}`);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

import { initializeApollo } from '../lib/apollo-client';
import { accountsQuery, totalCountQuery } from '../lib/graphql/queries';

import { getAllCollectiveStats } from '../utils/stats';

dayjs.extend(dayjsPluginUTC);
dayjs.extend(dayjsPluginIsoWeek);

const apolloClient = initializeApollo({ fetch: nodeFetch });

async function graphqlRequest(query, variables: any = {}) {
  const maxRetries = 5;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { data } = await apolloClient.query({ query, variables });
      return data;
    } catch (error) {
      console.error(`Attempt ${attempt}/${maxRetries} failed:`, error.message);
      if (attempt < maxRetries) {
        console.log(`Retrying...`);
      }
    }
  }

  throw new Error('Failed to fetch data after multiple retries');
}

async function fetchDataForPage(host) {
  const { slug, hostSlugs, currency } = host;
  const quarterFrom = dayjs.utc().subtract(12, 'week').startOf('isoWeek').toISOString();
  const quarterTo = dayjs.utc().subtract(1, 'week').endOf('isoWeek').toISOString();
  const yearFrom = dayjs.utc().subtract(12, 'month').startOf('month').toISOString();
  const yearTo = dayjs.utc().subtract(1, 'month').endOf('month').toISOString();

  const variables = {
    host: hostSlugs ? hostSlugs.map(s => ({ slug: s })) : { slug },
    currency,
    quarterFrom,
    quarterTo,
    yearFrom,
    yearTo,
    offset: 0,
    limit: 100,
  };

  console.log(variables);

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
    return data;
  }
}

async function run() {
  // Get total number of collectives on platform
  const {
    data: {
      accounts: { totalCount },
    },
  } = await apolloClient.query({
    query: totalCountQuery,
  });

  const directory = path.join(__dirname, '..', '_data');

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory);
  }
  const collectiveCounts = {
    platform: totalCount,
  };

  let rootData;

  const rootHost = hosts.find(h => h.root);
  // Get data for each host, including updating the shared.json file with collective counts
  for (const host of hosts) {
    console.log('Get data for', host.name);
    let data;

    if (rootData && rootHost.hostSlugs.includes(host.slug) && rootHost.currency === host.currency) {
      // Can use already fetched data.
      const hostedAccounts = rootData.accounts.nodes.filter(a => a.host?.slug === host.slug);
      data = {
        accounts: {
          totalCount: hostedAccounts.length,
          offset: 0,
          limit: hostedAccounts.length,
          nodes: hostedAccounts,
        },
      };
    } else {
      data = await fetchDataForPage(host);

      // add total stats to collectives, and filter away collectives with no stats data
      const updatedAccounts = {
        ...data.accounts,
        nodes: data.accounts.nodes
          .map(account => {
            const stats = getAllCollectiveStats(account);
            return {
              ...account,
              stats,
            };
          })
          .filter(account => account.stats),
      };

      data = {
        ...data,
        accounts: updatedAccounts,
      };

      if (host.root) {
        rootData = data;
      }
    }

    if (data) {
      collectiveCounts[host.root ? 'ALL' : host.slug] = data.accounts.nodes.length;

      // write data to file
      const filename = path.join(directory, `${host.root ? 'ALL' : host.slug}.json`);
      console.log('Writing to file', filename);

      fs.writeFile(filename, JSON.stringify(data, null, 2), error => {
        if (error) {
          throw error;
        }
      });
    }
  }

  // write collective count to shared.json
  fs.writeFile(path.join(directory, 'shared.json'), JSON.stringify({ collectiveCounts }), error => {
    if (error) {
      throw error;
    }
  });
}

run();
