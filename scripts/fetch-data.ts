import fs from 'fs';
import path from 'path';

import dayjs from 'dayjs';
import dayjsPluginIsoWeek from 'dayjs/plugin/isoWeek';
import dayjsPluginUTC from 'dayjs/plugin/utc';
import dotenv from 'dotenv';
import nodeFetch from 'node-fetch';

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

function graphqlRequest(query, variables = {}) {
  return apolloClient
    .query({
      query,
      variables,
    })
    .then(result => result.data);
}

async function run() {
  const hostSlug = 'foundation';

  const quarterAgo = dayjs.utc().subtract(12, 'week').startOf('isoWeek').toISOString();
  const yearAgo = dayjs.utc().subtract(12, 'month').startOf('month').toISOString();

  const variables = { hostSlug, quarterAgo, yearAgo, offset: 0, limit: 100 };

  let data = await graphqlRequest(accountsQuery, variables);

  if (data.accounts.totalCount > data.accounts.limit) {
    let nodes = [...data.accounts.nodes];
    do {
      variables.offset += data.accounts.limit;
      console.log(`Paginating with offset ${variables.offset}`);

      data = await graphqlRequest(accountsQuery, variables);
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
    const filename = path.join(__dirname, '..', '_dump', `${hostSlug}.json`);

    fs.writeFile(filename, JSON.stringify(data, null, 2), error => {
      if (error) {
        throw error;
      }
    });
  }
}

run();
